import { type MiddlewareConfigFn } from 'wasp/server'
import { type Request, type Response } from 'express'
import express from 'express'
import { prisma } from 'wasp/server'
import crypto from 'crypto'

const PLAID_WEBHOOK_VERIFICATION_KEY =
  process.env.PLAID_WEBHOOK_VERIFICATION_KEY

// Middleware to parse JSON body for Plaid webhooks
export const plaidWebhookMiddlewareConfigFn: MiddlewareConfigFn =
  middlewareConfig => {
    middlewareConfig.set('express.json', express.json())
    return middlewareConfig
  }

/**
 * Verifies Plaid webhook signature
 */
function verifyPlaidWebhook(body: string, signature: string): boolean {
  if (!PLAID_WEBHOOK_VERIFICATION_KEY) {
    console.warn('PLAID_WEBHOOK_VERIFICATION_KEY not configured')
    return false
  }

  const hash = crypto
    .createHmac('sha256', PLAID_WEBHOOK_VERIFICATION_KEY)
    .update(body)
    .digest('hex')

  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(signature))
}

/**
 * Handles incoming Plaid webhook events
 */
export async function handlePlaidWebhook(
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _context: any,
) {
  console.log('[handlePlaidWebhook] Received webhook')

  // Verify webhook signature
  const signature = req.headers['plaid-verification'] as string
  const rawBody = JSON.stringify(req.body)

  if (!signature || !verifyPlaidWebhook(rawBody, signature)) {
    console.error('Invalid Plaid webhook signature')
    return res.status(401).send('Unauthorized')
  }

  const { webhook_type, webhook_code, item_id } = req.body

  console.log(
    `Plaid webhook: ${webhook_type} - ${webhook_code} for item ${item_id}`,
  )

  try {
    switch (webhook_type) {
      case 'TRANSACTIONS': {
        if (webhook_code === 'SYNC_UPDATES_AVAILABLE') {
          // Find the institution by itemId
          const institution = await prisma.institution.findUnique({
            where: { itemId: item_id },
            select: { id: true, userId: true },
          })

          if (!institution) {
            console.warn(
              `Institution not found for item_id: ${item_id}. Ignoring webhook.`,
            )
            return res.status(200).send('Institution not found')
          }

          console.log(
            `Triggering sync for institution ${institution.id} (user: ${institution.userId})`,
          )

          // Trigger async sync - don't await to avoid webhook timeout
          // Import syncTransactions dynamically to avoid circular dependencies
          import('./operations.js').then(({ syncTransactions }) => {
            syncTransactions({ institutionId: institution.id }, {
              user: { id: institution.userId },
              entities: prisma,
            } as any).catch(error => {
              console.error(
                `Error syncing transactions for institution ${institution.id}:`,
                error,
              )
            })
          })

          return res.status(200).send('Sync triggered')
        } else {
          console.log(`Unhandled TRANSACTIONS webhook code: ${webhook_code}`)
          return res.status(200).send('Webhook received')
        }
      }

      case 'ITEM': {
        // Handle item-related webhooks (errors, pending expiration, etc.)
        if (webhook_code === 'ERROR') {
          console.error(
            `Item error for ${item_id}:`,
            JSON.stringify(req.body.error),
          )
        }
        return res.status(200).send('Webhook received')
      }

      default:
        console.log(`Unhandled webhook type: ${webhook_type}`)
        return res.status(200).send('Webhook received')
    }
  } catch (error: any) {
    console.error('Error processing Plaid webhook:', error)
    return res.status(500).send('Internal server error')
  }
}
