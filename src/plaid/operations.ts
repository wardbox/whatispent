import { HttpError } from 'wasp/server'
import type {
  CreateLinkToken,
  ExchangePublicToken,
  SyncTransactions,
  GetSpendingSummary,
  GetMonthlySpending,
  GetCategorySpending,
  GetAllTransactions,
  GetInstitutions,
  DeleteInstitution,
  // DeleteInstitution will be implicitly typed by Wasp later
} from 'wasp/server/operations'
import {
  _internalCreateLinkToken,
  _internalExchangePublicToken,
  _internalFetchTransactions,
  _internalFetchBalances,
} from './service'
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
  institutionId: string
  /** Optional: Force fetch from a specific date YYYY-MM-DD */
  startDate?: string
}
type SyncTransactionsResult = {
  syncedTransactions: number
  institutionId: string
}

// Added types for deleteInstitution
type DeleteInstitutionPayload = {
  institutionId: string
}
type DeleteInstitutionResult = {
  success: boolean
  institutionId: string
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
    } = await _internalExchangePublicToken(args.publicToken)

    // 2. Use Prisma transaction to ensure atomicity
    const newInstitution = await context.entities.Institution.create({
      data: {
        user: { connect: { id: context.user.id } },
        accessToken: accessToken, // Store the encrypted token
        itemId: itemId,
        institutionName: institutionName,
        plaidInstitutionId: plaidInstitutionId, // Store Plaid's ID
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

    syncTransactions({ institutionId: newInstitution.id }, context)

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

// We will add syncTransactions action later
/**
 * Wasp Action: Fetches latest transactions from Plaid for a given institution
 * and upserts them into the database.
 */
export const syncTransactions = (async (
  args: SyncTransactionsPayload,
  context,
) => {
  if (!context.user) {
    throw new HttpError(401)
  }

  const { institutionId, startDate: forceStartDate } = args

  // 1. Fetch the institution and its accounts
  const institution = await context.entities.Institution.findUnique({
    where: { id: institutionId, userId: context.user.id },
    include: { accounts: { select: { id: true, plaidAccountId: true } } },
  })

  if (!institution) {
    throw new HttpError(
      404,
      'Institution not found or does not belong to user.',
    )
  }
  if (!institution.accounts || institution.accounts.length === 0) {
    console.warn(
      `No accounts found for institution ${institutionId}. Skipping sync.`,
    )
    return { syncedTransactions: 0, institutionId: institutionId }
  }

  // Create a map from plaidAccountId to our internal Account ID
  const accountIdMap = new Map<string, string>(
    institution.accounts.map(acc => [acc.plaidAccountId, acc.id]),
  )

  // 2. Determine date range
  // Default: last 30 days or since last sync (whichever is more recent, up to 2 years back for Plaid)
  const twoYearsAgo = dayjs().subtract(2, 'year').format('YYYY-MM-DD')
  let startDate = forceStartDate
    ? forceStartDate // Use forced start date if provided
    : institution.lastSync
      ? dayjs(institution.lastSync).format('YYYY-MM-DD') // Use last sync date
      : dayjs().subtract(30, 'days').format('YYYY-MM-DD') // Default to 30 days ago

  // Ensure start date is not more than 2 years ago
  if (dayjs(startDate).isBefore(twoYearsAgo)) {
    console.warn(
      `Start date ${startDate} is more than 2 years ago. Adjusting to ${twoYearsAgo}.`,
    )
    startDate = twoYearsAgo
  }

  const endDate = dayjs().format('YYYY-MM-DD') // Today

  console.log(
    `Syncing transactions for institution ${institutionId} from ${startDate} to ${endDate}`,
  )

  try {
    // 3. Fetch transactions from Plaid service
    const plaidTransactions = await _internalFetchTransactions(
      institution.accessToken, // Pass encrypted token
      startDate,
      endDate,
    )

    // 3.5 Fetch latest balances
    const plaidAccountsWithBalances = await _internalFetchBalances(
      institution.accessToken,
    )

    if (plaidTransactions.length === 0) {
      console.log(
        `No new transactions found for institution ${institutionId} in the date range.`,
      )
      // Still update lastSync even if no transactions found
      await context.entities.Institution.update({
        where: { id: institutionId },
        data: { lastSync: new Date() },
      })
      return { syncedTransactions: 0, institutionId: institutionId }
    }

    // 4. Prepare data for upsert
    const transactionData = plaidTransactions
      .map(tx => {
        const internalAccountId = accountIdMap.get(tx.account_id)
        if (!internalAccountId) {
          console.warn(
            `Skipping transaction ${tx.transaction_id}: Cannot find internal account for Plaid account ${tx.account_id}`,
          )
          return null // Skip this transaction if account mapping fails
        }
        // Data structure for Prisma TransactionUncheckedCreateInput
        const createData = {
          userId: institution.userId, // Direct foreign key
          accountId: internalAccountId, // Direct foreign key
          plaidTransactionId: tx.transaction_id,
          amount: tx.amount, // Plaid uses negative for debits
          date: dayjs(tx.date).toDate(), // Convert string date to Date object
          merchantName: tx.merchant_name ?? tx.name, // Use merchant_name if available, else name
          name: tx.name, // Original description
          category: tx.personal_finance_category?.primary
            ? [tx.personal_finance_category.primary]
            : [], // Ensure it's always string[]
          categoryIconUrl: tx.personal_finance_category_icon_url ?? undefined, // Assuming this field exists in schema
          pending: tx.pending,
        }
        return createData
      })
      .filter((tx): tx is NonNullable<typeof tx> => tx !== null)

    // 5. Upsert transactions and update lastSync
    const upsertTransactionPromises = transactionData.map(txData => {
      // Data for the update part (fields that can change)
      const updateData = {
        amount: txData.amount,
        date: txData.date,
        merchantName: txData.merchantName,
        name: txData.name,
        category: txData.category, // Already correctly typed as string[] from createData
        pending: txData.pending,
        // Do not include userId, accountId, or plaidTransactionId here
      }

      return context.entities.Transaction.upsert({
        where: { plaidTransactionId: txData.plaidTransactionId },
        create: txData, // Use the full createData object here
        update: updateData, // Use the specific updateData object here
      })
    })

    // Execute transaction upserts concurrently
    await Promise.all(upsertTransactionPromises)

    // 6. Update account balances
    const updateBalancePromises = plaidAccountsWithBalances.map(
      plaidAccount => {
        const internalAccountId = accountIdMap.get(plaidAccount.account_id)
        if (!internalAccountId) {
          console.warn(
            `Skipping balance update for Plaid account ${plaidAccount.account_id}: Cannot find internal account.`,
          )
          return Promise.resolve() // Skip if account not found in our DB
        }
        return context.entities.Account.update({
          where: { id: internalAccountId },
          data: {
            currentBalance: plaidAccount.balances.current,
          },
        })
      },
    )

    // Execute balance updates concurrently
    await Promise.all(updateBalancePromises)

    // 7. Update lastSync timestamp on the institution
    const updatedInstitution = await context.entities.Institution.update({
      where: { id: institutionId },
      data: { lastSync: new Date() },
    })

    console.log(
      `Successfully synced ${transactionData.length} transactions for institution ${institutionId}. Last sync updated to ${updatedInstitution.lastSync}`,
    )

    return {
      syncedTransactions: transactionData.length,
      institutionId: institutionId,
    }
  } catch (error: any) {
    console.error(
      `Error syncing transactions for institution ${institutionId}:`,
      error.message,
    )
    if (error.response?.data?.error_code === 'ITEM_LOGIN_REQUIRED') {
      // Log or handle specific Plaid errors like login required
      console.warn(
        `Plaid item login required for institution ${institutionId}. Sync failed.`,
      )
      // Optionally update institution status here
      throw new HttpError(
        400,
        `Connection requires update for institution ${institution.institutionName}. Please reconnect.`,
      )
    }
    // Rethrow a generic error
    throw new HttpError(
      500,
      `Failed to sync transactions for institution ${institution.institutionName}.`,
    )
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
    select: { id: true, institutionName: true }, // Select minimal fields needed
  })

  if (!institution) {
    throw new HttpError(404, 'Institution not found or access denied.')
  }

  console.log(
    `Attempting to delete institution ${institution.institutionName} (ID: ${institutionId}) for user ${context.user.id}`,
  )

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
        gt: 0, // Expenses are positive amounts
      },
      pending: false,
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
    // Plaid amounts are positive for expenses, ensure we handle it consistently
    const amount = tx.amount // Use amount directly as it's filtered for gt: 0

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
        gt: 0, // Expenses are positive in Plaid
      },
      pending: false,
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
    const amount = Math.abs(tx.amount)
    periodTotals[periodKey] = (periodTotals[periodKey] || 0) + amount
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
        gt: 0, // Expenses are positive in Plaid
      },
      pending: false,
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
      const amount = Math.abs(tx.amount)
      categoryTotals[primaryCategory] =
        (categoryTotals[primaryCategory] || 0) + amount
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
    institution: {
      institutionName: string
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
    },
    include: {
      // Use include to fetch related data
      account: {
        select: {
          name: true,
          institution: {
            select: {
              institutionName: true,
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

// Update the result type to include accounts
type GetInstitutionsResult = (Pick<
  Institution,
  'id' | 'institutionName' | 'lastSync' | 'plaidInstitutionId'
> & {
  accounts: Pick<
    Account,
    'id' | 'name' | 'mask' | 'type' | 'subtype' | 'currentBalance'
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
      accounts: {
        // Include accounts
        select: {
          id: true,
          name: true,
          mask: true,
          type: true,
          subtype: true,
          currentBalance: true,
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
