import { type MiddlewareConfigFn } from 'wasp/server'
import { type Request, type Response } from 'express'
import express from 'express'
import { prisma } from 'wasp/server'
import crypto from 'crypto'
import { jwtVerify, importJWK } from 'jose'
import { plaidClient } from './client.js'

const NODE_ENV = process.env.NODE_ENV || 'development'

// Middleware to capture raw body before parsing (needed for webhook signature verification)
export const plaidWebhookMiddlewareConfigFn: MiddlewareConfigFn =
  middlewareConfig => {
    middlewareConfig.set(
      'express.json',
      express.json({
        verify: (req: any, _res, buf) => {
          // Store raw body buffer for signature verification
          req.rawBody = buf.toString('utf8')
        },
      }),
    )
    return middlewareConfig
  }

/**
 * Verifies Plaid webhook JWT signature
 * Reference: https://plaid.com/docs/api/webhooks/webhook-verification/
 */
async function verifyPlaidWebhook(
  body: string,
  jwtToken: string,
): Promise<boolean> {
  // In development, skip verification with warning
  if (NODE_ENV === 'development') {
    console.warn('⚠️  Development mode - skipping Plaid webhook verification')
    return true
  }

  try {
    // Step 1: Decode JWT header without verification to get kid (key ID)
    const [headerB64] = jwtToken.split('.')
    const header = JSON.parse(Buffer.from(headerB64, 'base64').toString())

    // Step 2: Verify algorithm is ES256
    if (header.alg !== 'ES256') {
      console.error(`Invalid JWT algorithm: ${header.alg}, expected ES256`)
      return false
    }

    // Step 3: Get verification key from Plaid using the kid
    const keyResponse = await plaidClient.webhookVerificationKeyGet({
      key_id: header.kid,
    })

    const key = keyResponse.data.key

    // Step 4: Convert JWK to crypto key and verify JWT
    const publicKey = await importJWK(
      {
        kty: 'EC',
        use: 'sig',
        crv: key.crv,
        x: key.x,
        y: key.y,
        alg: 'ES256',
      },
      'ES256',
    )

    const { payload } = await jwtVerify(jwtToken, publicKey, {
      algorithms: ['ES256'],
      maxTokenAge: '5m', // Built-in 5-minute freshness check
    })

    // Step 5: Validate iat claim is present and valid (defense in depth)
    const issuedAt = payload.iat

    if (typeof issuedAt !== 'number' || !Number.isFinite(issuedAt)) {
      console.error('Webhook JWT missing or invalid iat claim')
      return false
    }

    // Additional check: verify absolute age doesn't exceed 5 minutes
    const currentTime = Math.floor(Date.now() / 1000)
    const age = Math.abs(currentTime - issuedAt)

    if (age > 300) {
      console.error(`Webhook JWT age (${age}s) exceeds 5 minutes`)
      return false
    }

    // Step 6: Verify body hash matches (using constant-time comparison to prevent timing attacks)
    // Note: The request body must be normalized exactly as Plaid sent it (canonical JSON, no extra whitespace)
    // for the computed hash to match Plaid's signature
    const bodyHash = crypto.createHash('sha256').update(body).digest('hex')

    // Validate the claimed hash from JWT payload
    const claimedHash = payload.request_body_sha256

    if (typeof claimedHash !== 'string') {
      console.error(
        `Webhook JWT missing or invalid request_body_sha256 claim: ${typeof claimedHash}`,
      )
      return false
    }

    // Verify it's a valid 64-character hex SHA-256 digest
    if (!/^[0-9a-f]{64}$/i.test(claimedHash)) {
      console.error(
        `Webhook JWT request_body_sha256 claim is not a valid SHA-256 hex digest: ${claimedHash}`,
      )
      return false
    }

    // Convert to buffers for constant-time comparison
    const bodyHashBuffer = Buffer.from(bodyHash, 'hex')
    const claimedHashBuffer = Buffer.from(claimedHash, 'hex')

    // Ensure same length before comparison (timingSafeEqual requires equal lengths)
    if (bodyHashBuffer.length !== claimedHashBuffer.length) {
      console.error('Webhook body hash length mismatch')
      return false
    }

    // Use constant-time comparison to prevent timing attacks
    if (!crypto.timingSafeEqual(bodyHashBuffer, claimedHashBuffer)) {
      console.error('Webhook body hash mismatch')
      return false
    }

    return true
  } catch (error) {
    console.error('Plaid webhook verification error:', error)
    return false
  }
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

  // Verify webhook JWT signature
  const jwtToken = req.headers['plaid-verification'] as string
  const rawBody = (req as any).rawBody ?? JSON.stringify(req.body)

  if (!jwtToken) {
    console.error('Missing Plaid-Verification header')
    return res.status(401).send('Unauthorized')
  }

  const isValid = await verifyPlaidWebhook(rawBody, jwtToken)
  if (!isValid) {
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
        // Handle transaction-related webhooks that require syncing
        if (
          webhook_code === 'SYNC_UPDATES_AVAILABLE' ||
          webhook_code === 'INITIAL_UPDATE' ||
          webhook_code === 'HISTORICAL_UPDATE'
        ) {
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
            `Triggering sync for institution ${institution.id} (user: ${institution.userId}) - webhook: ${webhook_code}`,
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
