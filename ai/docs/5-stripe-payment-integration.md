# Stripe Payment Integration

**Status:** Implemented

**Goal:** Integrate Stripe to handle a single, fixed-price ($4.99/month)
subscription plan, allowing users to subscribe and manage their subscription.

## Implementation Details

### Backend (`src/stripe/`)

- **Client (`client.ts`):** Initializes the Stripe Node.js client using the
  `STRIPE_SECRET_KEY` from environment variables.
- **Service (`service.ts`):**
  - `_findOrCreateStripeCustomer`: Retrieves an existing Stripe Customer ID from
    the `User` model or creates a new Stripe Customer (checking by email first),
    storing the ID (`stripeCustomerId`) on the `User`.
  - `_createStripeCheckoutSession`: Creates a Stripe Checkout Session for the
    single plan (using `STRIPE_PRICE_ID` from env) associated with the user's
    Stripe Customer ID. Configures success and cancel URLs
    (`/checkout?success=true...`, `/checkout?canceled=true...`).
  - `_createStripeCustomerPortalSession`: Creates a Stripe Billing Portal
    session for a given Stripe Customer ID, allowing users to manage their
    existing subscription. Sets the return URL to `/settings` (or similar).
- **Operations (`operations.ts`):**
  - `createCheckoutSession`: Wasp Action. Authenticates the user, retrieves the
    `STRIPE_PRICE_ID`, calls `_createStripeCheckoutSession`, and returns the
    session URL and ID.
  - `createCustomerPortalSession`: Wasp Action. Authenticates the user, checks
    for `stripeCustomerId`, calls `_createStripeCustomerPortalSession`, and
    returns the portal URL.
- **Webhooks (`webhooks.ts`):**
  - `handleStripeWebhook`: Wasp API Function exposed via `api stripeWebhook`.
    - Uses `stripeWebhookMiddlewareConfigFn` to configure `express.raw`
      middleware, making the raw request body available on `req.body` for
      signature verification.
    - Verifies the incoming webhook signature using
      `stripe.webhooks.constructEvent`, `req.body`, the `stripe-signature`
      header, and `STRIPE_WEBHOOK_SECRET`.
    - Handles `checkout.session.completed`, `customer.subscription.updated`, and
      `customer.subscription.deleted` events.
    - Updates the `subscriptionStatus` field on the Wasp `User` entity based on
      the event data using `prisma.user.update`.

### Frontend

- **Subscription Page (`src/SubscriptionPage.tsx`):**
  - Route: `/subscription`
  - Displays hardcoded details for the single plan.
  - Uses `useAuth` to get user data (including `subscriptionStatus`).
  - Provides a "Subscribe Now" button if the user is not active:
    - Calls the `createCheckoutSession` action.
    - Redirects the user to the Stripe Checkout URL.
  - Provides a "Manage Subscription" button if the user is active:
    - Calls the `createCustomerPortalSession` action.
    - Redirects the user to the Stripe Billing Portal URL (using the
      `sessionUrl` key returned by the action).
  - Handles loading states for the buttons.
- **Checkout Result Page (`src/CheckoutResultPage.tsx`):**
  - Route: `/checkout`
  - Handles redirects from Stripe after checkout attempts.
  - Displays a success message if `?success=true` is present.
  - Displays a cancellation message if `?canceled=true` is present.
  - Provides a link back to the dashboard.

### Configuration

- **`main.wasp`:**
  - Declares `createCheckoutSession` and `createCustomerPortalSession` actions.
  - Declares `api stripeWebhook` with `handleStripeWebhook` function,
    `stripeWebhookMiddlewareConfigFn`, and POST route `/stripe-webhooks`.
  - Defines routes `/subscription` and `/checkout`.
- **`schema.prisma`:**
  - `User` model includes `stripeCustomerId String? @unique` and
    `subscriptionStatus String?`.
- **Environment Variables (`.env.server`):**
  - `STRIPE_SECRET_KEY`: Your Stripe secret API key.
  - `STRIPE_PRICE_ID`: The ID of the $4.99/month Price object created in Stripe.
  - `STRIPE_WEBHOOK_SECRET`: The webhook signing secret obtained from
    `stripe listen` or Stripe Dashboard.
  - `CLIENT_URL`: The base URL of your frontend application (e.g.,
    `http://localhost:3000`).

### Local Testing

- Requires running
  `stripe listen --forward-to http://localhost:3001/stripe-webhooks` (adjust
  port if needed) to forward webhook events locally.
- Requires setting the correct `STRIPE_WEBHOOK_SECRET` from the `stripe listen`
  output in `.env.server`.
