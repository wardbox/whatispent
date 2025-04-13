// import { type User } from 'wasp/entities'; // Keep User import for context type checking
import { HttpError } from 'wasp/server'
// Import generated action types
import {
  type CreateCheckoutSession,
  type CreateCustomerPortalSession,
} from 'wasp/server/operations'
import {
  _createStripeCheckoutSession,
  _createStripeCustomerPortalSession,
} from './service.js'
import { type User } from 'wasp/entities' // Keep User import for context type checking

// Remove unused type aliases
// type CreateCheckoutSessionInput = unknown;
// type CreateCheckoutSessionOutput = { sessionUrl: string; sessionId: string };

// Removed args from CreateCheckoutSession as we use a fixed plan
export const createCheckoutSession: CreateCheckoutSession = async (
  _args, // No longer expecting priceId here
  context,
) => {
  if (!context.user) {
    throw new HttpError(401, 'User not authenticated')
  }

  // Removed explicit prismaContext casting as we pass the whole context

  // Get the single plan's Price ID from server environment variables
  const priceId = process.env.STRIPE_PRICE_ID
  if (!priceId) {
    console.error('STRIPE_PRICE_ID environment variable is not set.')
    throw new HttpError(
      500,
      'Server configuration error: Stripe Price ID missing.',
    )
  }

  try {
    // Pass context.entities.User as the second argument
    const { url, sessionId } = await _createStripeCheckoutSession(
      context.user as User & {
        stripeCustomerId: string | null
        email: string | null
      },
      context.entities.User, // Pass the Prisma User delegate
      priceId,
    )
    if (!url) {
      throw new HttpError(500, 'Checkout session URL is unexpectedly null.')
    }
    return { sessionUrl: url, sessionId }
  } catch (error: any) {
    console.error('Error in createCheckoutSession action:', error)
    if (error instanceof HttpError) {
      throw error
    } else {
      throw new HttpError(
        500,
        error.message ||
          'An unexpected error occurred creating checkout session.',
      )
    }
  }
}

// Remove unused type aliases
// type CreateCustomerPortalSessionInput = unknown;
// type CreateCustomerPortalSessionOutput = { sessionUrl: string };

// Remove custom ActionFn and ContextWithUser

// No changes needed for createCustomerPortalSession for single plan
export const createCustomerPortalSession: CreateCustomerPortalSession = async (
  _args,
  context,
) => {
  if (!context.user) {
    throw new HttpError(401, 'User not authenticated.')
  }
  if (!context.user.stripeCustomerId) {
    throw new HttpError(403, 'User does not have a Stripe customer ID.')
  }

  try {
    const { url } = await _createStripeCustomerPortalSession(
      context.user.stripeCustomerId,
    )
    if (!url) {
      throw new HttpError(
        500,
        'Customer portal session URL is unexpectedly null.',
      )
    }
    // Frontend expects sessionUrl key
    return { sessionUrl: url }
  } catch (error: any) {
    console.error('Error in createCustomerPortalSession action:', error)
    if (error instanceof HttpError) {
      throw error
    } else {
      throw new HttpError(
        500,
        error.message ||
          'An unexpected error occurred creating portal session.',
      )
    }
  }
}
