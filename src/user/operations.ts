import { HttpError } from 'wasp/server'
import type { DeleteUserAccount, ExportUserData } from 'wasp/server/operations'
import stripe from '../stripe/client.js'

export const deleteUserAccount = (async (_args, context) => {
  if (!context.user) {
    throw new HttpError(401, 'You must be logged in to delete your account')
  }

  const userId = context.user.id
  const stripeCustomerId = context.user.stripeCustomerId

  try {
    // Step 1: Cancel all Stripe subscriptions if customer exists
    if (stripeCustomerId) {
      try {
        // Get all subscriptions for this customer
        const subscriptions = await stripe.subscriptions.list({
          customer: stripeCustomerId,
          limit: 100,
        })

        // Cancel all active subscriptions
        for (const subscription of subscriptions.data) {
          if (
            subscription.status === 'active' ||
            subscription.status === 'trialing'
          ) {
            await stripe.subscriptions.cancel(subscription.id)
            console.log(
              `Canceled subscription ${subscription.id} for user ${userId}`,
            )
          }
        }

        // Step 2: Delete the Stripe customer
        await stripe.customers.del(stripeCustomerId)
        console.log(
          `Deleted Stripe customer ${stripeCustomerId} for user ${userId}`,
        )
      } catch (stripeError: any) {
        console.error('Error deleting Stripe customer:', stripeError)
        // Continue with account deletion even if Stripe cleanup fails
        // Log the error but don't block the user from deleting their account
      }
    }

    // Step 3: Delete all user data
    // Thanks to cascade deletes in Prisma schema:
    // - Deleting User will cascade delete all Institutions
    // - Deleting Institutions will cascade delete all Accounts
    // - Deleting Accounts will cascade delete all Transactions
    // - User.transactions also cascade deletes
    await context.entities.User.delete({
      where: { id: userId },
    })

    console.log(`Successfully deleted user account ${userId}`)
    return { success: true }
  } catch (error: any) {
    console.error('Error deleting user account:', error)
    throw new HttpError(500, `Failed to delete account: ${error.message}`)
  }
}) satisfies DeleteUserAccount

export const exportUserData = (async (_args, context) => {
  if (!context.user) {
    throw new HttpError(401, 'You must be logged in to export your data')
  }

  const userId = context.user.id

  try {
    // Fetch all user data
    const user = await context.entities.User.findUnique({
      where: { id: userId },
      include: {
        institutions: {
          include: {
            accounts: {
              include: {
                transactions: {
                  orderBy: { date: 'desc' },
                },
              },
            },
          },
        },
      },
    })

    if (!user) {
      throw new HttpError(404, 'User not found')
    }

    // Remove sensitive fields before export
    const exportData = {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        subscriptionStatus: user.subscriptionStatus,
        trialEndsAt: user.trialEndsAt,
        lastSyncedAt: user.lastSyncedAt,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      institutions: user.institutions.map(institution => ({
        id: institution.id,
        institutionName: institution.institutionName,
        plaidInstitutionId: institution.plaidInstitutionId,
        lastSync: institution.lastSync,
        logo: institution.logo,
        createdAt: institution.createdAt,
        updatedAt: institution.updatedAt,
        accounts: institution.accounts.map(account => ({
          id: account.id,
          name: account.name,
          mask: account.mask,
          type: account.type,
          subtype: account.subtype,
          currentBalance: account.currentBalance,
          isTracked: account.isTracked,
          createdAt: account.createdAt,
          updatedAt: account.updatedAt,
          transactions: account.transactions.map(transaction => ({
            id: transaction.id,
            amount: transaction.amount,
            date: transaction.date,
            merchantName: transaction.merchantName,
            name: transaction.name,
            category: transaction.category,
            pending: transaction.pending,
            createdAt: transaction.createdAt,
            updatedAt: transaction.updatedAt,
          })),
        })),
      })),
      exportedAt: new Date().toISOString(),
      exportVersion: '1.0',
    }

    console.log(`Exported data for user ${userId}`)
    return exportData
  } catch (error: any) {
    console.error('Error exporting user data:', error)
    throw new HttpError(500, `Failed to export data: ${error.message}`)
  }
}) satisfies ExportUserData
