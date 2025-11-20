import { HttpError } from 'wasp/server'
import type {
  CreateLinkToken,
  CreateUpdateModeLinkToken,
  ExchangePublicToken,
  ExchangeUpdateModeToken,
  SyncTransactions,
  GetSpendingSummary,
  GetMonthlySpending,
  GetCategorySpending,
  GetAllTransactions,
  GetInstitutions,
  DeleteInstitution,
  ToggleAccountTracking,
  // DeleteInstitution will be implicitly typed by Wasp later
} from 'wasp/server/operations'
import {
  _internalCreateLinkToken,
  _internalExchangePublicToken,
  _internalFetchBalances,
  _internalSyncTransactions,
} from './service'
import { decrypt } from './utils/encryption.js'
import { plaidClient } from './client.js'
import dayjs from 'dayjs'
import {
  type Transaction,
  type Institution,
  type Account,
} from '@prisma/client'
import weekOfYear from 'dayjs/plugin/weekOfYear.js'
import utc from 'dayjs/plugin/utc.js'
import isBetween from 'dayjs/plugin/isBetween.js'

// We explicitly use context.entities which are typed, so these aren't strictly needed
// import type { User, Institution, Account } from '@wasp/entities';
// import type { Prisma } from '@prisma/client';

// Type definitions adhering to guidelines
type CreateLinkTokenPayload = void // No input needed from frontend besides user context
type CreateLinkTokenResult = string // The link token

type ExchangePublicTokenPayload = {
  publicToken: string
}
type ExchangePublicTokenResult = {
  institutionId: string // Return the ID of the newly created institution
}

// Add types for syncTransactions
type SyncTransactionsPayload = {
  institutionId?: string // Made optional
  /** Optional: Force fetch from a specific date YYYY-MM-DD */
  startDate?: string
}
type SyncTransactionsResult = {
  syncedTransactions: number
  institutionId?: string // Make optional here too
}

// Added types for deleteInstitution
type DeleteInstitutionPayload = {
  institutionId: string
}
type DeleteInstitutionResult = {
  success: boolean
  institutionId: string
}

// Added types for toggleAccountTracking
type ToggleAccountTrackingPayload = {
  accountId: string
  isTracked: boolean
}
type ToggleAccountTrackingResult = {
  success: boolean
  accountId: string
  isTracked: boolean
}

/**
 * Wasp Action: Creates a Plaid Link token for the authenticated user.
 */
export const createLinkToken = (async (
  _args: CreateLinkTokenPayload,
  context,
) => {
  if (!context.user) {
    throw new HttpError(401) // Unauthorized
  }

  try {
    const linkToken = await _internalCreateLinkToken(context.user.id)
    return linkToken
  } catch (error: any) {
    // Log the error details on the server
    console.error('Error in createLinkToken action:', error.message)
    // Throw a generic error to the client
    throw new HttpError(500, 'Failed to create Plaid Link token.')
  }
}) satisfies CreateLinkToken<CreateLinkTokenPayload, CreateLinkTokenResult>

type CreateUpdateModeLinkTokenPayload = {
  institutionId: string
}
type CreateUpdateModeLinkTokenResult = {
  linkToken: string
}

/**
 * Wasp Action: Creates a Plaid Link token in Update Mode for re-authentication.
 * Used when an institution needs user to re-authenticate their credentials.
 */
export const createUpdateModeLinkToken = (async (
  args: CreateUpdateModeLinkTokenPayload,
  context,
) => {
  if (!context.user) {
    throw new HttpError(401, 'You must be logged in')
  }

  if (!args.institutionId) {
    throw new HttpError(400, 'Institution ID is required')
  }

  try {
    // Fetch the institution and verify ownership
    const institution = await context.entities.Institution.findUnique({
      where: { id: args.institutionId },
      select: { id: true, userId: true, accessToken: true, institutionName: true },
    })

    if (!institution) {
      throw new HttpError(404, 'Institution not found')
    }

    if (institution.userId !== context.user.id) {
      throw new HttpError(403, 'You do not have permission to access this institution')
    }

    // Verify accessToken exists before attempting to decrypt
    if (!institution.accessToken) {
      throw new HttpError(404, 'Institution access token not found')
    }

    // Decrypt the access token
    const decryptedAccessToken = decrypt(institution.accessToken)

    // Create link token in Update Mode
    const linkToken = await _internalCreateLinkToken(context.user.id, decryptedAccessToken)

    console.log(`Created Update Mode link token for institution ${institution.institutionName}`)

    return { linkToken }
  } catch (error: any) {
    console.error('Error creating Update Mode link token:', error.message)

    if (error instanceof HttpError) {
      throw error
    }

    throw new HttpError(500, 'Failed to create Update Mode link token')
  }
}) satisfies CreateUpdateModeLinkToken<CreateUpdateModeLinkTokenPayload, CreateUpdateModeLinkTokenResult>

/**
 * Wasp Action: Exchanges a Plaid public token for an access token,
 * fetches institution and account details, and saves them to the database.
 */
export const exchangePublicToken = (async (
  args: ExchangePublicTokenPayload,
  context,
) => {
  if (!context.user) {
    throw new HttpError(401)
  }
  if (!args.publicToken) {
    throw new HttpError(400, 'Public token is required.')
  }

  try {
    // 1. Exchange token and get institution/account details from Plaid
    const {
      accessToken, // Encrypted
      itemId,
      institutionName,
      institutionId: plaidInstitutionId, // Plaid's ID for the institution
      accounts: plaidAccounts,
      institutionLogo, // Destructure the logo from the response
    } = await _internalExchangePublicToken(args.publicToken)

    // Check if this institution already exists for this user
    const existingInstitution = await context.entities.Institution.findFirst({
      where: {
        plaidInstitutionId: plaidInstitutionId,
        userId: context.user.id,
      },
      select: { id: true }, // Only need to know if it exists
    })

    if (existingInstitution) {
      // If it exists, throw an error instead of creating a duplicate
      throw new HttpError(
        409, // Conflict
        `Institution '${institutionName}' is already linked to your account.`,
      )
    }

    // 2. Use Prisma transaction to ensure atomicity
    const newInstitution = await context.entities.Institution.create({
      data: {
        user: { connect: { id: context.user.id } },
        accessToken: accessToken, // Store the encrypted token
        itemId: itemId,
        institutionName: institutionName,
        plaidInstitutionId: plaidInstitutionId, // Store Plaid's ID
        logo: institutionLogo, // Save the base64 logo string
        accounts: {
          create: plaidAccounts.map(account => ({
            plaidAccountId: account.account_id,
            name: account.name,
            mask: account.mask ?? 'N/A', // Provide default if mask is null
            type: account.type,
            subtype: account.subtype ?? 'N/A', // Provide default if subtype is null
            currentBalance: account.balances?.current ?? null,
          })),
        },
      },
      select: { id: true }, // Only select the ID for the result
    })

    // Wait for 5 seconds before syncing transactions to allow Plaid time to prepare initial data
    await new Promise(resolve => setTimeout(resolve, 5000))

    // Calculate start date for initial 6-month sync
    const initialSyncStartDate = dayjs()
      .subtract(6, 'months')
      .format('YYYY-MM-DD')

    await syncTransactions(
      { institutionId: newInstitution.id, startDate: initialSyncStartDate },
      context,
    )

    return {
      institutionId: newInstitution.id,
    }
  } catch (error: any) {
    console.error('Error in exchangePublicToken action:', error.message)
    // Consider more specific errors based on the underlying service error
    throw new HttpError(
      500,
      'Failed to exchange public token and save institution.',
    )
  }
}) satisfies ExchangePublicToken<
  ExchangePublicTokenPayload,
  ExchangePublicTokenResult
>

type ExchangeUpdateModeTokenPayload = {
  publicToken: string
  institutionId: string
}
type ExchangeUpdateModeTokenResult = {
  institutionId: string
}

/**
 * Wasp Action: Exchanges a public token from Update Mode (re-authentication)
 * and updates the existing institution's access token.
 */
export const exchangeUpdateModeToken = (async (
  args: ExchangeUpdateModeTokenPayload,
  context,
) => {
  if (!context.user) {
    throw new HttpError(401, 'You must be logged in')
  }
  if (!args.publicToken) {
    throw new HttpError(400, 'Public token is required')
  }
  if (!args.institutionId) {
    throw new HttpError(400, 'Institution ID is required')
  }

  try {
    // 1. Verify the institution exists and belongs to the user
    const institution = await context.entities.Institution.findUnique({
      where: { id: args.institutionId },
      select: { id: true, userId: true, institutionName: true },
    })

    if (!institution) {
      throw new HttpError(404, 'Institution not found')
    }

    if (institution.userId !== context.user.id) {
      throw new HttpError(403, 'You do not have permission to update this institution')
    }

    // 2. Exchange the public token for a new access token
    const {
      accessToken, // Encrypted
      itemId,
    } = await _internalExchangePublicToken(args.publicToken)

    // 3. Update the institution with the new access token and reset status
    await context.entities.Institution.update({
      where: { id: args.institutionId },
      data: {
        accessToken: accessToken, // Update with new encrypted token
        itemId: itemId, // Update item ID (should be same, but update to be safe)
        status: 'active', // Reset status to active
        errorCode: null, // Clear any error codes
      },
    })

    console.log(`Successfully re-authenticated institution ${institution.institutionName}`)

    // 4. Trigger immediate sync to refresh data after re-authentication
    try {
      await syncTransactions({ institutionId: args.institutionId }, context)
      console.log(`Triggered immediate sync after re-authentication for institution ${institution.institutionName}`)
    } catch (syncError: any) {
      // Log sync error but don't fail the re-authentication
      console.error(`Failed to sync after re-authentication for institution ${args.institutionId}:`, syncError.message)
    }

    return {
      institutionId: args.institutionId,
    }
  } catch (error: any) {
    console.error('Error in exchangeUpdateModeToken action:', error.message)

    if (error instanceof HttpError) {
      throw error
    }

    throw new HttpError(
      500,
      'Failed to update institution credentials',
    )
  }
}) satisfies ExchangeUpdateModeToken<
  ExchangeUpdateModeTokenPayload,
  ExchangeUpdateModeTokenResult
>

// Internal helper function to sync a single institution using modern /transactions/sync
async function _syncSingleInstitution(
  institutionId: string,
  forceStartDate: string | undefined,
  context: any,
): Promise<{ syncedTransactions: number; institutionId: string }> {
  if (!context.user) {
    throw new HttpError(401)
  }

  // 1. Fetch the institution and its accounts
  const institution = await context.entities.Institution.findUnique({
    where: { id: institutionId, userId: context.user.id },
    include: { accounts: { select: { id: true, plaidAccountId: true } } },
  })

  if (!institution) {
    throw new HttpError(
      404,
      `Institution ${institutionId} not found or does not belong to user.`,
    )
  }
  if (!institution.accounts || institution.accounts.length === 0) {
    console.warn(
      `No accounts found for institution ${institutionId}. Skipping sync.`,
    )
    await context.entities.Institution.update({
      where: { id: institutionId },
      data: { lastSync: new Date() },
    })
    return { syncedTransactions: 0, institutionId: institutionId }
  }

  // Create a map from plaidAccountId to our internal Account ID
  const accountIdMap = new Map<string, string>(
    institution.accounts.map((acc: Account) => [acc.plaidAccountId, acc.id]),
  )

  console.log(
    `Syncing transactions for institution ${institutionId} using /transactions/sync`,
  )

  try {
    // 2. Use cursor from institution, or "now" for migration from old approach
    const cursor = institution.cursor || undefined

    // 3. Fetch transactions using the new sync endpoint
    const syncResult = await _internalSyncTransactions(
      institution.accessToken,
      cursor,
    )

    let totalProcessed = 0

    // 4. Process ADDED transactions
    if (syncResult.added.length > 0) {
      const addedData = syncResult.added
        .map(tx => {
          const internalAccountId = accountIdMap.get(tx.account_id)
          if (!internalAccountId) {
            console.warn(
              `Skipping added transaction ${tx.transaction_id}: account ${tx.account_id} not found`,
            )
            return null
          }

          let transactionDate: Date
          if (tx.authorized_datetime) {
            transactionDate = new Date(tx.authorized_datetime)
          } else if (tx.datetime) {
            transactionDate = new Date(tx.datetime)
          } else {
            transactionDate = new Date(tx.date + 'T00:00:00Z')
          }

          return {
            plaidTransactionId: tx.transaction_id,
            userId: context.user.id,
            accountId: internalAccountId,
            amount: tx.amount,
            date: transactionDate,
            merchantName: tx.merchant_name,
            name: tx.name,
            category: tx.personal_finance_category?.primary
              ? [tx.personal_finance_category.primary]
              : [],
            pending: tx.pending,
          }
        })
        .filter(tx => tx !== null)

      if (addedData.length > 0) {
        const result = await context.entities.Transaction.createMany({
          data: addedData,
          skipDuplicates: true,
        })
        totalProcessed += result.count
        console.log(
          `Institution ${institutionId}: Added ${result.count} new transactions`,
        )
      }
    }

    // 5. Process MODIFIED transactions
    if (syncResult.modified.length > 0) {
      for (const tx of syncResult.modified) {
        const internalAccountId = accountIdMap.get(tx.account_id)
        if (!internalAccountId) {
          console.warn(
            `Skipping modified transaction ${tx.transaction_id}: account not found`,
          )
          continue
        }

        let transactionDate: Date
        if (tx.authorized_datetime) {
          transactionDate = new Date(tx.authorized_datetime)
        } else if (tx.datetime) {
          transactionDate = new Date(tx.datetime)
        } else {
          transactionDate = new Date(tx.date + 'T00:00:00Z')
        }

        await context.entities.Transaction.updateMany({
          where: { plaidTransactionId: tx.transaction_id },
          data: {
            amount: tx.amount,
            date: transactionDate,
            merchantName: tx.merchant_name,
            name: tx.name,
            category: tx.personal_finance_category?.primary
              ? [tx.personal_finance_category.primary]
              : [],
            pending: tx.pending,
          },
        })
      }
      console.log(
        `Institution ${institutionId}: Updated ${syncResult.modified.length} modified transactions`,
      )
    }

    // 6. Process REMOVED transactions
    if (syncResult.removed.length > 0) {
      const removedIds = syncResult.removed.map(tx => tx.transaction_id)
      await context.entities.Transaction.deleteMany({
        where: {
          plaidTransactionId: { in: removedIds },
        },
      })
      console.log(
        `Institution ${institutionId}: Removed ${syncResult.removed.length} deleted transactions`,
      )
    }

    // 7. Fetch and update account balances
    try {
      const plaidAccountsWithBalances = await _internalFetchBalances(
        institution.accessToken,
      )

      if (plaidAccountsWithBalances.length > 0) {
        const balanceUpdates = plaidAccountsWithBalances.map(plaidAcc => {
          const internalAccountId = accountIdMap.get(plaidAcc.account_id)
          if (internalAccountId) {
            return context.entities.Account.update({
              where: { id: internalAccountId },
              data: {
                currentBalance: plaidAcc.balances?.current ?? null,
                updatedAt: new Date(),
              },
            })
          }
          return Promise.resolve()
        })
        await Promise.all(balanceUpdates)
        console.log(
          `Institution ${institutionId}: Updated balances for ${plaidAccountsWithBalances.length} accounts`,
        )
      }
    } catch (balanceError: any) {
      console.error(
        `Error fetching balances for institution ${institutionId}: ${balanceError.message}`,
      )
    }

    // 8. Update cursor and lastSync timestamp
    await context.entities.Institution.update({
      where: { id: institutionId },
      data: {
        lastSync: new Date(),
        cursor: syncResult.nextCursor,
      },
    })

    // Mark institution as active on successful sync
    if (institution.status !== 'active') {
      await context.entities.Institution.update({
        where: { id: institutionId },
        data: {
          status: 'active',
          errorCode: null,
        },
      })
    }

    return { syncedTransactions: totalProcessed, institutionId: institutionId }
  } catch (error: any) {
    console.error(
      `Error syncing transactions for institution ${institutionId}:`,
      error.message,
    )

    // Check if this is a Plaid error requiring re-authentication
    const errorCode = error.response?.data?.error_code || error.error_code
    const requiresReauth = [
      'ITEM_LOGIN_REQUIRED',
      'ITEM_LOCKED',
      'ITEM_NOT_SUPPORTED',
      'INVALID_CREDENTIALS',
      'INSUFFICIENT_CREDENTIALS',
      'MFA_NOT_SUPPORTED',
      'NO_ACCOUNTS',
      'INSTITUTION_NO_LONGER_SUPPORTED',
      // Note: INSTITUTION_DOWN and INSTITUTION_NOT_RESPONDING are transient errors
      // and should be treated as 'error' status rather than requiring re-auth
    ].includes(errorCode)

    if (requiresReauth) {
      console.warn(
        `Institution ${institutionId} requires re-authentication. Error code: ${errorCode}`,
      )

      // Mark institution as needing re-authentication
      await context.entities.Institution.update({
        where: { id: institutionId },
        data: {
          status: 'needs_reauth',
          errorCode: errorCode,
          lastSync: new Date(), // Update lastSync to prevent continuous retry
        },
      })

      throw new HttpError(
        400,
        `Institution requires re-authentication. Please reconnect your account.`,
      )
    }

    // For other errors, mark as error status
    if (errorCode) {
      await context.entities.Institution.update({
        where: { id: institutionId },
        data: {
          status: 'error',
          errorCode: errorCode,
        },
      })
    }

    throw new HttpError(500, `Failed to sync institution ${institutionId}.`)
  }
}

/**
 * Wasp Action: Fetches latest transactions from Plaid for one or all institutions
 * and upserts them into the database. Updates User.lastSyncedAt on bulk sync.
 */
export const syncTransactions = (async (
  args: SyncTransactionsPayload,
  context,
) => {
  if (!context.user) {
    throw new HttpError(401)
  }

  const { institutionId, startDate: forceStartDate } = args

  if (institutionId) {
    // --- Sync Single Institution --- (Existing logic moved to helper)
    console.log(`Starting sync for single institution: ${institutionId}`)
    try {
      const result = await _syncSingleInstitution(
        institutionId,
        forceStartDate,
        context,
      )
      // In single mode, we might also update User.lastSyncedAt if desired,
      // but the primary trigger relies on it, so maybe not necessary here.
      // await context.entities.User.update({ where: { id: context.user.id }, data: { lastSyncedAt: new Date() } });
      return result
    } catch (error) {
      // Error already logged in helper, re-throw for the client action
      console.error(
        `Sync failed for single institution ${institutionId}: re-throwing error.`,
      )
      throw error // Propagate error back to the client
    }
  } else {
    // --- Sync All Institutions for User --- (New logic)
    console.log(`Starting bulk sync for user: ${context.user.id}`)
    const institutions = await context.entities.Institution.findMany({
      where: { userId: context.user.id },
      select: { id: true, institutionName: true }, // Select necessary fields
    })

    if (institutions.length === 0) {
      console.log(`User ${context.user.id} has no institutions to sync.`)
      // Update user's sync time even if no institutions, indicates attempt
      await context.entities.User.update({
        where: { id: context.user.id },
        data: { lastSyncedAt: new Date() },
      })
      return { syncedTransactions: 0 } // Return total count
    }

    let totalSyncedCount = 0
    const syncPromises: Promise<{ syncedTransactions: number }>[] = []

    console.log(`Found ${institutions.length} institutions to sync.`) // Log count

    for (const inst of institutions) {
      console.log(
        `Queueing sync for institution: ${inst.institutionName} (${inst.id})`,
      ) // Log each queued institution
      // Call the helper for each institution. Catch errors individually.
      syncPromises.push(
        _syncSingleInstitution(inst.id, forceStartDate, context).catch(
          error => {
            // Log individual failures but don't stop the bulk process
            console.error(
              `Sync failed for institution ${inst.institutionName} (${inst.id}) during bulk sync: ${error.message}`,
            )
            return { syncedTransactions: 0 } // Return 0 count for failed ones
          },
        ),
      )
    }

    // Wait for all syncs to complete (or fail individually)
    const results = await Promise.all(syncPromises)

    // Sum up the counts from successful syncs
    totalSyncedCount = results.reduce((sum, r) => sum + r.syncedTransactions, 0)

    // Update User.lastSyncedAt after attempting all institutions
    try {
      await context.entities.User.update({
        where: { id: context.user.id },
        data: { lastSyncedAt: new Date() },
      })
      console.log(
        `Bulk sync complete for user ${context.user.id}. Total new transactions: ${totalSyncedCount}. Updated user lastSyncedAt.`,
      )
    } catch (updateError) {
      console.error(
        `Failed to update User.lastSyncedAt for user ${context.user.id} after bulk sync: ${updateError}`,
      )
      // Don't throw here, the sync might have partially succeeded
    }

    // Result for bulk sync doesn't include institutionId
    return { syncedTransactions: totalSyncedCount }
  }
}) satisfies SyncTransactions<SyncTransactionsPayload, SyncTransactionsResult>

/**
 * Wasp Action: Deletes a specific financial institution and all its associated data
 * (accounts, transactions) for the authenticated user.
 */
export const deleteInstitution = (async (
  args: DeleteInstitutionPayload,
  context,
): Promise<DeleteInstitutionResult> => {
  if (!context.user) {
    throw new HttpError(401)
  }

  const { institutionId } = args

  if (!institutionId) {
    throw new HttpError(400, 'Institution ID is required.')
  }

  // Verify the institution belongs to the user before deleting
  const institution = await context.entities.Institution.findUnique({
    where: { id: institutionId, userId: context.user.id },
    select: { id: true, institutionName: true, accessToken: true },
  })

  if (!institution) {
    throw new HttpError(404, 'Institution not found or access denied.')
  }

  console.log(
    `Attempting to delete institution ${institution.institutionName} (ID: ${institutionId}) for user ${context.user.id}`,
  )

  // Call Plaid /item/remove to deactivate the item (Plaid requirement)
  if (!institution.accessToken) {
    console.warn(
      `Institution ${institutionId} has no accessToken, skipping Plaid item removal`,
    )
  } else {
    try {
      const decryptedAccessToken = decrypt(institution.accessToken)
      await plaidClient.itemRemove({
        access_token: decryptedAccessToken,
      })
      console.log(
        `Successfully removed Plaid item for institution ${institution.institutionName}`,
      )
    } catch (plaidError: any) {
      // Log the error but continue with deletion - don't block user from deleting
      console.error(
        `Failed to remove Plaid item for institution ${institutionId}:`,
        plaidError.response?.data || plaidError.message,
      )
      console.warn(
        'Continuing with database deletion despite Plaid API error',
      )
    }
  }

  // Delete from database (cascade deletes accounts and transactions)
  try {
    await context.entities.Institution.delete({
      where: { id: institutionId },
    })

    console.log(
      `Successfully deleted institution ${institution.institutionName} (ID: ${institutionId})`,
    )
    return {
      success: true,
      institutionId: institutionId,
    }
  } catch (error: any) {
    console.error(`Error deleting institution ${institutionId}:`, error.message)
    throw new HttpError(
      500,
      `Failed to delete institution ${institution.institutionName}.`,
    )
  }
}) satisfies DeleteInstitution<
  DeleteInstitutionPayload,
  DeleteInstitutionResult
>

dayjs.extend(weekOfYear)
dayjs.extend(utc)
dayjs.extend(isBetween)

// Define the structure for a single period's summary
type SpendingPeriodSummary = {
  amount: number
  change: number // Percentage change compared to the previous period
}

// Update the main summary type
type SpendingSummary = {
  today: SpendingPeriodSummary
  thisWeek: SpendingPeriodSummary
  thisMonth: SpendingPeriodSummary
}

export const getSpendingSummary: GetSpendingSummary<
  void,
  SpendingSummary
> = async (_args, context) => {
  if (!context.user) {
    throw new HttpError(401)
  }

  const userId = context.user.id
  const now = dayjs.utc()

  // Define date ranges for current and previous periods
  const startOfToday = now.startOf('day')
  const endOfToday = now.endOf('day')
  const startOfYesterday = now.subtract(1, 'day').startOf('day')
  const endOfYesterday = now.subtract(1, 'day').endOf('day')

  const startOfWeek = now.startOf('week')
  const endOfWeek = now.endOf('week')
  const startOfLastWeek = now.subtract(1, 'week').startOf('week')
  const endOfLastWeek = now.subtract(1, 'week').endOf('week')

  const startOfMonth = now.startOf('month')
  const endOfMonth = now.endOf('month')
  const startOfLastMonth = now.subtract(1, 'month').startOf('month')
  const endOfLastMonth = now.subtract(1, 'month').endOf('month')

  // Fetch transactions starting from the beginning of the *previous* month
  const transactions = await context.entities.Transaction.findMany({
    where: {
      userId: userId,
      date: {
        gte: startOfLastMonth.toDate(), // Fetch data needed for comparisons
      },
      amount: {
        gt: 0, // Only expenses (Plaid convention: positive = OUT, negative = IN)
      },
      pending: false,
      account: {
        isTracked: true, // Only include tracked accounts
      },
    },
    select: {
      amount: true,
      date: true,
    },
  })

  // Initialize totals
  let todayTotal = 0
  let yesterdayTotal = 0
  let thisWeekTotal = 0
  let lastWeekTotal = 0
  let thisMonthTotal = 0
  let lastMonthTotal = 0

  // Aggregate amounts into periods
  transactions.forEach(tx => {
    const txDate = dayjs.utc(tx.date)
    // Amount is already positive (we filtered for expenses only)
    const amount = tx.amount

    // Check this month vs last month
    if (txDate.isBetween(startOfMonth, endOfMonth, null, '[]')) {
      thisMonthTotal += amount
    } else if (txDate.isBetween(startOfLastMonth, endOfLastMonth, null, '[]')) {
      lastMonthTotal += amount
    }

    // Check this week vs last week
    if (txDate.isBetween(startOfWeek, endOfWeek, null, '[]')) {
      thisWeekTotal += amount
    } else if (txDate.isBetween(startOfLastWeek, endOfLastWeek, null, '[]')) {
      lastWeekTotal += amount
    }

    // Check today vs yesterday
    if (txDate.isBetween(startOfToday, endOfToday, null, '[]')) {
      todayTotal += amount
    } else if (txDate.isBetween(startOfYesterday, endOfYesterday, null, '[]')) {
      yesterdayTotal += amount
    }
  })

  // Helper function to calculate percentage change
  const calculatePercentageChange = (
    current: number,
    previous: number,
  ): number => {
    if (previous === 0) {
      // If previous is 0, return 100% if current > 0, otherwise 0%
      return current > 0 ? 100 : 0
    }
    const change = ((current - previous) / previous) * 100
    // Round to one decimal place
    return Math.round(change * 10) / 10
  }

  // Construct the summary object
  const summary: SpendingSummary = {
    today: {
      amount: todayTotal,
      change: calculatePercentageChange(todayTotal, yesterdayTotal),
    },
    thisWeek: {
      amount: thisWeekTotal,
      change: calculatePercentageChange(thisWeekTotal, lastWeekTotal),
    },
    thisMonth: {
      amount: thisMonthTotal,
      change: calculatePercentageChange(thisMonthTotal, lastMonthTotal),
    },
  }

  return summary
}

// Update Args type
type MonthlySpendingArgs = {
  months?: number
  granularity?: 'monthly' | 'daily' // Add granularity option
}

// Update Entry type
type MonthlySpendingEntry = {
  period: string // Can be 'YYYY-MM' or 'YYYY-MM-DD'
  total: number
}

export const getMonthlySpending: GetMonthlySpending<
  MonthlySpendingArgs,
  MonthlySpendingEntry[]
> = async (args, context) => {
  if (!context.user) {
    throw new HttpError(401)
  }

  const userId = context.user.id
  const numMonths = args?.months ?? 6
  const granularity = args?.granularity ?? 'monthly'

  let startDate: Date
  let periodFormat: string

  if (granularity === 'daily' && numMonths === 1) {
    // If daily granularity requested for 1 month, fetch last 30 days
    startDate = dayjs.utc().subtract(30, 'day').startOf('day').toDate()
    periodFormat = 'YYYY-MM-DD'
  } else {
    // Default to monthly aggregation
    startDate = dayjs
      .utc()
      .subtract(numMonths - 1, 'month')
      .startOf('month')
      .toDate()
    periodFormat = 'YYYY-MM'
  }

  const transactions = await context.entities.Transaction.findMany({
    where: {
      userId: userId,
      date: {
        gte: startDate,
      },
      amount: {
        gt: 0, // Only expenses (Plaid convention: positive = OUT, negative = IN)
      },
      pending: false,
      account: {
        isTracked: true, // Only include tracked accounts
      },
    },
    select: {
      amount: true,
      date: true,
    },
    orderBy: {
      date: 'asc',
    },
  })

  const periodTotals: { [key: string]: number } = {}

  transactions.forEach(tx => {
    const periodKey = dayjs.utc(tx.date).format(periodFormat)
    // Amount is already positive (we filtered for expenses only)
    periodTotals[periodKey] = (periodTotals[periodKey] || 0) + tx.amount
  })

  const result: MonthlySpendingEntry[] = []
  const today = dayjs.utc()

  if (granularity === 'daily' && numMonths === 1) {
    // Generate entries for the last 30 days
    for (let i = 0; i < 30; i++) {
      const date = today.subtract(29 - i, 'day')
      const periodKey = date.format('YYYY-MM-DD')
      result.push({
        period: periodKey,
        total: periodTotals[periodKey] || 0,
      })
    }
  } else {
    // Generate entries for the last numMonths
    for (let i = 0; i < numMonths; i++) {
      const date = today.subtract(numMonths - 1 - i, 'month')
      const periodKey = date.format('YYYY-MM')
      result.push({
        period: periodKey,
        total: periodTotals[periodKey] || 0,
      })
    }
  }

  return result
}

type CategorySpendingEntry = {
  category: string
  total: number
}

export const getCategorySpending: GetCategorySpending<
  void,
  CategorySpendingEntry[]
> = async (_args, context) => {
  if (!context.user) {
    throw new HttpError(401)
  }

  const userId = context.user.id
  const now = dayjs.utc()
  const startDate = now.startOf('month').toDate()
  const endDate = now.endOf('month').toDate()

  const transactions = await context.entities.Transaction.findMany({
    where: {
      userId: userId,
      date: {
        gte: startDate,
        lte: endDate,
      },
      amount: {
        gt: 0, // Only expenses (Plaid convention: positive = OUT, negative = IN)
      },
      pending: false,
      account: {
        isTracked: true, // Only include tracked accounts
      },
      NOT: {
        category: {
          isEmpty: true,
        },
      },
    },
    select: {
      amount: true,
      category: true,
    },
  })

  const categoryTotals: { [key: string]: number } = {}

  transactions.forEach(tx => {
    const primaryCategory = tx.category[0]
    if (primaryCategory) {
      // Amount is already positive (we filtered for expenses only)
      categoryTotals[primaryCategory] =
        (categoryTotals[primaryCategory] || 0) + tx.amount
    }
  })

  const result: CategorySpendingEntry[] = Object.entries(categoryTotals)
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total)

  return result
}

type AllTransactionsArgs = {
  skip?: number
  take?: number
}

// Define a more specific return type including related data
export type TransactionWithDetails = Transaction & {
  account: {
    name: string
    mask: string | null
    institution: {
      institutionName: string
      logo: string | null
    }
  }
}

export const getAllTransactions = (async (args, context) => {
  if (!context.user) {
    throw new HttpError(401)
  }

  const userId = context.user.id

  const transactions = await context.entities.Transaction.findMany({
    where: {
      userId: userId,
      account: {
        isTracked: true, // Only include tracked accounts
      },
    },
    // Select the fields needed from Transaction and related Account/Institution
    select: {
      id: true,
      plaidTransactionId: true,
      amount: true,
      date: true,
      merchantName: true,
      name: true,
      category: true, // <-- Ensure category is selected
      pending: true,
      userId: true,
      accountId: true,
      createdAt: true,
      updatedAt: true,
      // Select related account data directly
      account: {
        select: {
          name: true,
          mask: true,
          institution: {
            select: {
              institutionName: true,
              logo: true,
            },
          },
        },
      },
    },
    orderBy: {
      date: 'desc',
    },
    skip: args?.skip,
    take: args?.take,
  })

  // Cast the result to the specific type. Prisma's include guarantees the structure.
  return transactions as TransactionWithDetails[]
}) satisfies GetAllTransactions<AllTransactionsArgs, TransactionWithDetails[]>

// Update the result type to include accounts, logo, status, and errorCode
type GetInstitutionsResult = (Pick<
  Institution,
  'id' | 'institutionName' | 'lastSync' | 'plaidInstitutionId' | 'logo' | 'status' | 'errorCode'
> & {
  accounts: Pick<
    Account,
    'id' | 'name' | 'mask' | 'type' | 'subtype' | 'currentBalance' | 'isTracked'
  >[]
})[]

/**
 * Wasp Query: Fetches all financial institutions linked by the authenticated user,
 * including their associated accounts.
 */
export const getInstitutions: GetInstitutions<
  void,
  GetInstitutionsResult
> = async (_args, context) => {
  if (!context.user) {
    throw new HttpError(401)
  }

  const institutions = await context.entities.Institution.findMany({
    where: { userId: context.user.id },
    select: {
      id: true,
      institutionName: true,
      lastSync: true,
      plaidInstitutionId: true,
      logo: true, // Select logo
      status: true, // Select status for re-auth handling
      errorCode: true, // Select error code for debugging
      accounts: {
        // Include accounts
        select: {
          id: true,
          name: true,
          mask: true,
          type: true,
          subtype: true,
          currentBalance: true,
          isTracked: true,
        },
        orderBy: {
          name: 'asc', // Order accounts alphabetically
        },
      },
    },
    orderBy: {
      createdAt: 'asc',
    },
  })

  return institutions
}

/**
 * Wasp Action: Toggles whether an account should be tracked in spending calculations.
 */
export const toggleAccountTracking = (async (
  args: ToggleAccountTrackingPayload,
  context,
) => {
  if (!context.user) {
    throw new HttpError(401)
  }
  if (!args.accountId) {
    throw new HttpError(400, 'Account ID is required.')
  }

  // Verify the account belongs to the user
  const account = await context.entities.Account.findUnique({
    where: { id: args.accountId },
    include: {
      institution: {
        select: { userId: true },
      },
    },
  })

  if (!account) {
    throw new HttpError(404, 'Account not found.')
  }

  if (account.institution.userId !== context.user.id) {
    throw new HttpError(
      403,
      'You do not have permission to modify this account.',
    )
  }

  // Update the account
  await context.entities.Account.update({
    where: { id: args.accountId },
    data: { isTracked: args.isTracked },
  })

  return {
    success: true,
    accountId: args.accountId,
    isTracked: args.isTracked,
  }
}) satisfies ToggleAccountTracking<
  ToggleAccountTrackingPayload,
  ToggleAccountTrackingResult
>
