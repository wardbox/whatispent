import { type MiddlewareConfigFn } from 'wasp/server'
import { type Request, type Response } from 'express'
import express from 'express'
import stripe from './client.js'
import { prisma } from 'wasp/server'
import Stripe from 'stripe'

const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET

if (!STRIPE_WEBHOOK_SECRET) {
  console.warn(
    'STRIPE_WEBHOOK_SECRET environment variable is not set. Webhook verification will fail.',
  )
}

// Middleware Configuration Function
export const stripeWebhookMiddlewareConfigFn: MiddlewareConfigFn =
  middlewareConfig => {
    middlewareConfig.delete('express.json')
    middlewareConfig.set(
      'express.raw',
      express.raw({ type: 'application/json' }),
    )
    return middlewareConfig
  }

// Helper function to map Stripe subscription status to our internal status
function mapStripeStatusToUserStatus(
  stripeStatus: Stripe.Subscription.Status,
): string {
  switch (stripeStatus) {
    case 'active':
    case 'trialing':
      return 'active'
    case 'past_due':
    case 'unpaid':
      return 'past_due'
    case 'canceled':
    case 'incomplete_expired':
      return 'canceled'
    case 'incomplete': // Customer needs to complete payment
      return 'incomplete'
    default:
      return 'unknown' // Or handle other statuses as needed
  }
}

export async function handleStripeWebhook(req: Request, res: Response) {
  // --- DEBUGGING ---
  console.debug('[handleStripeWebhook] Entering function.')
  console.debug(
    '[handleStripeWebhook] Request headers:',
    JSON.stringify(req.headers, null, 2),
  )
  // @ts-ignore - rawBody is added by middleware
  console.debug(
    '[handleStripeWebhook] Does req.rawBody exist?:',
    req.hasOwnProperty('rawBody'),
  )
  // @ts-ignore - rawBody is added by middleware
  console.debug('[handleStripeWebhook] req.rawBody type:', typeof req.rawBody)
  // @ts-ignore - rawBody is added by middleware
  // --- END DEBUGGING ---

  if (!STRIPE_WEBHOOK_SECRET) {
    console.error('Stripe webhook secret is not configured.')
    return res.status(500).send('Webhook secret not configured.')
  }

  const sig = req.headers['stripe-signature'] as string
  let event: Stripe.Event

  try {
    // Use raw body for verification - this should work now with the middleware config
    // @ts-ignore - Wasp types might not reflect rawBody added by middleware immediately
    // const rawBody = (req as any).rawBody; // Try accessing explicitly just in case
    // console.log('[handleStripeWebhook] Attempting constructEvent with rawBody type:', typeof rawBody);
    // if (!rawBody) {
    //   console.error('[handleStripeWebhook] rawBody is missing or empty BEFORE constructEvent!');
    //   return res.status(400).send('Webhook Error: Missing request body payload.');
    // }
    // Switching to req.body based on example and previous error
    console.debug(
      '[handleStripeWebhook] Attempting constructEvent with req.body',
    )
    console.debug('[handleStripeWebhook] req.body type:', typeof req.body)
    console.debug(
      '[handleStripeWebhook] req.body value:',
      req.body ? JSON.stringify(req.body).substring(0, 100) + '...' : 'N/A',
    ) // Log first 100 chars

    event = stripe.webhooks.constructEvent(req.body, sig, STRIPE_WEBHOOK_SECRET)
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`)
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }

  console.log(`Received Stripe event: ${event.type}`)

  // Handle the event
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        // Check if it's a subscription checkout
        if (
          session.mode === 'subscription' &&
          session.customer &&
          session.subscription
        ) {
          const customerId = session.customer as string
          const subscriptionId = session.subscription as string

          // Retrieve the subscription to get the status
          const subscription =
            await stripe.subscriptions.retrieve(subscriptionId)
          const userStatus = mapStripeStatusToUserStatus(subscription.status)

          await prisma.user.update({
            where: { stripeCustomerId: customerId },
            data: { subscriptionStatus: userStatus },
          })
          console.log(
            `Updated user status for customer ${customerId} to ${userStatus} after checkout.`,
          )
        } else if (session.mode === 'setup') {
          console.log(
            'Setup intent session completed, no subscription status change.',
          )
        } else {
          console.log(
            `Checkout session completed (mode: ${session.mode}), but not a subscription. No status update.`,
          )
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string
        const userStatus = mapStripeStatusToUserStatus(subscription.status)

        await prisma.user.update({
          where: { stripeCustomerId: customerId },
          data: { subscriptionStatus: userStatus },
        })
        console.log(
          `Updated user status for customer ${customerId} to ${userStatus} due to subscription update.`,
        )
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string
        const userStatus = 'canceled' // Subscription deleted means canceled status

        await prisma.user.update({
          where: { stripeCustomerId: customerId },
          data: { subscriptionStatus: userStatus },
        })
        console.log(
          `Updated user status for customer ${customerId} to ${userStatus} due to subscription deletion.`,
        )
        break
      }

      default:
        console.log(`Unhandled event type ${event.type}`)
    }

    // Return a 200 response to acknowledge receipt of the event
    res.status(200).send()
  } catch (error: any) {
    console.error('Error processing webhook event:', error)
    // Check if it's a Prisma error (e.g., user not found)
    if (error.code === 'P2025') {
      // Prisma code for "Record to update not found."
      // Extracting customer ID might be brittle depending on error structure
      const customerIdGuess =
        (error.meta?.cause as string)?.split(' ')?.pop() || 'unknown'
      console.warn(
        `Webhook handler: User with Stripe Customer ID ${customerIdGuess} not found.`,
      )
      // Still return 200 to Stripe, as we can't retry this successfully
      res.status(200).send('User not found, but acknowledging event.')
    } else {
      res.status(500).send('Internal Server Error processing webhook.')
    }
  }
}
