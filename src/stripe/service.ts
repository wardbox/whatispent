import { type User } from 'wasp/entities'
import { HttpError } from 'wasp/server'
import stripe from './client.js'
// Remove unused import
// import prisma from 'wasp/server'
// Import Prisma types if needed for the delegate type
import { type PrismaClient } from '@prisma/client'

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000' // Default for development

async function _findOrCreateStripeCustomer(
  user: User,
  // Use Prisma delegate type - adjust if UserDelegate import is available/different
  prismaUserDelegate: PrismaClient['user'],
): Promise<string> {
  if (user.stripeCustomerId) {
    // Check if the customer exists in Stripe and hasn't been deleted
    try {
      const customer = await stripe.customers.retrieve(user.stripeCustomerId)
      if (!customer.deleted) {
        return user.stripeCustomerId
      }
      // If deleted in Stripe, clear it from our DB and proceed to create a new one
      // Use the delegate directly
      await prismaUserDelegate.update({
        where: { id: user.id },
        data: { stripeCustomerId: null },
      })
    } catch (error) {
      // Handle cases where retrieve fails (e.g., customer ID is invalid)
      console.warn(
        `Failed to retrieve Stripe customer ${user.stripeCustomerId}, creating a new one. Error: ${error}`,
      )
      await prismaUserDelegate.update({
        where: { id: user.id },
        data: { stripeCustomerId: null },
      })
    }
  }

  // Look for existing customer by email first
  if (user.email) {
    const customers = await stripe.customers.list({
      email: user.email,
      limit: 1,
    })
    if (customers.data.length > 0) {
      const stripeCustomerId = customers.data[0].id
      await prismaUserDelegate.update({
        where: { id: user.id },
        data: { stripeCustomerId },
      })
      return stripeCustomerId
    }
  }

  // Create a new customer
  const customer = await stripe.customers.create({
    email: user.email ?? undefined, // Stripe expects email or undefined, not null
    metadata: {
      userId: user.id, // Link Stripe customer to our user ID
    },
  })

  await prismaUserDelegate.update({
    where: { id: user.id },
    data: { stripeCustomerId: customer.id },
  })

  return customer.id
}

export async function _createStripeCheckoutSession(
  user: User,
  prismaUserDelegate: PrismaClient['user'], // Expect Prisma User Delegate
  priceId: string, // Add priceId argument
): Promise<{ sessionId: string; url: string | null }> {
  const stripeCustomerId = await _findOrCreateStripeCustomer(
    user,
    prismaUserDelegate, // Pass the delegate
  )

  const successUrl = `${CLIENT_URL}/checkout?success=true&sessionId={CHECKOUT_SESSION_ID}`
  const cancelUrl = `${CLIENT_URL}/checkout?canceled=true`

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      customer: stripeCustomerId,
      success_url: successUrl,
      cancel_url: cancelUrl,
      automatic_tax: { enabled: true },
    })

    if (!session.url) {
      throw new HttpError(500, 'Stripe checkout session URL is missing')
    }

    return { sessionId: session.id, url: session.url }
  } catch (error: any) {
    console.error('Error creating Stripe checkout session:', error)
    throw new HttpError(
      500,
      `Failed to create Stripe checkout session: ${error.message}`,
    )
  }
}

export async function _createStripeCustomerPortalSession(
  stripeCustomerId: string,
): Promise<{ url: string | null }> {
  const returnUrl = `${CLIENT_URL}/settings` // Redirect back to settings page

  try {
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: returnUrl,
    })
    return { url: portalSession.url }
  } catch (error: any) {
    console.error('Error creating Stripe customer portal session:', error)
    throw new HttpError(
      500,
      `Failed to create Stripe customer portal session: ${error.message}`,
    )
  }
}
