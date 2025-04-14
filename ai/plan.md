# What I Spent - Implementation Plan

This plan outlines the steps to build the "What I Spent" application using Wasp,
assuming development with the assistance of an LLM coding editor.

## Phase 1: Setup & Core Structure

1.  - [x] **Initialize Wasp Project**:
    * - [x] Run `wasp new WhatISpent`
    * - [x] Configure basic project settings if needed.
2.  - [x] **Implement Authentication**:
    * - [x] Enable Wasp's email/password or other desired auth method in
            `main.wasp`.
    * - [x] Create basic Login/Signup pages. All subsequent features will
            require user authentication.
3.  - [x] **Define Database Schema (`schema.prisma`)**:
    * - [x] **User**: Default Wasp user model. Add relation to `Institution`.
            Add `stripeCustomerId` (String, optional, unique) and
            `subscriptionStatus` (String, optional - e.g., "active", "canceled",
            "incomplete").
    * - [x] **Institution** (formerly PlaidItem): Stores details for each linked
            financial institution.
      * - [x] `id` (String, CUID)
      * - [x] `userId` (String - matching User ID type)
      * - [x] `user` (Relation to User)
      * - [x] `accessToken` (String - **Must be encrypted in application
              logic**)
      * - [x] `itemId` (String, unique - Plaid's Item ID)
      * - [x] `institutionName` (String)
      * - [x] `lastSync` (DateTime, optional)
    * - [x] **Account**: Represents individual accounts within an `Institution`.
      * - [x] `id` (String, CUID)
      * - [x] `institutionId` (String - FK to Institution)
      * - [x] `institution` (Relation to Institution)
      * - [x] `plaidAccountId` (String, unique - Plaid's Account ID)
      * - [x] `name` (String)
      * - [x] `mask` (String)
      * - [x] `type` (String - e.g., checking, savings, credit)
      * - [x] `subtype` (String)
    * - [x] **Transaction**: Stores individual transactions.
      * - [x] `id` (String, CUID)
      * - [x] `userId` (String - matching User ID type)
      * - [x] `user` (Relation to User)
      * - [x] `accountId` (String)
      * - [x] `account` (Relation to Account)
      * - [x] `plaidTransactionId` (String, unique - Plaid's Transaction ID)
      * - [x] `amount` (Float - Use negative for debits/spending)
      * - [x] `date` (DateTime - Date of transaction)
      * - [x] `merchantName` (String, optional)
      * - [x] `name` (String - Transaction description)
      * - [x] `category` (String Array - Plaid categories)
      * - [x] `pending` (Boolean)
4.  - [x] **Run Migrations**:
    * - [x] `wasp db migrate-dev`

## Phase 2: Plaid Integration (Backend)

1.  - [x] **Setup Plaid**:
    * - [x] Get Plaid API keys (start with Sandbox). Store securely (e.g.,
            environment variables, `.env.server`).
    * - [x] Install Plaid Node client: `npm install plaid`
    * - [x] Install `dayjs` dependency: `npm install dayjs`
2.  - [x] **Create Plaid Service and Wasp Operations (`src/plaid/`)**:
    * - [x] Create `src/plaid/client.ts`: Initialize and configure the Plaid
            client using environment variables.
    * - [x] Create `src/plaid/service.ts`: Implement core Plaid API interaction
            functions (`_internalCreateLinkToken`,
            `_internalExchangePublicToken`, `_internalFetchTransactions`).
            Handle `accessToken` encryption/decryption here or using a utility.
    * - [x] Create `src/plaid/operations.ts`: Define Wasp Actions
            (`createLinkToken`, `exchangePublicToken`, `syncTransactions`) that
            call the service functions and interact with the database.
            Plaid-related Wasp Queries will also go here later.
    * - [x] _(Optional but Recommended)_ Create `src/server/utils/encryption.ts`
            for encrypting/decrypting the Plaid `accessToken`. Requires an
            `ENCRYPTION_KEY` environment variable. (Assuming this was done
            implicitly or previously)
3.  - [x] **Declare Plaid Actions in `main.wasp`**: Import and declare the
          Actions (`createLinkToken`, `exchangePublicToken`, `syncTransactions`)
          from `src/plaid/operations.ts` with necessary `entities`.

## Phase 3: Backend Logic (Data Queries)

1.  - [x] **Create Wasp Queries (`src/plaid/operations.ts`)**: **Completed**
    * - [x] Moved queries (`getSpendingSummary`, `getMonthlySpending`,
            `getCategorySpending`, `getAllTransactions`) from `src/queries.ts`
            to `src/plaid/operations.ts` to keep Plaid logic together.
    * - [x] Implemented logic to fetch and aggregate transaction data
            (summaries, monthly, category).
    * - [x] Ensured queries filter for logged-in user and non-pending expenses.
    * - [x] `getUserSubscriptionStatus` remains in `src/queries.ts`.
2.  - [x] **Declare Queries in `main.wasp`**: **Completed**
    * - [x] Declared new queries, linking them to `src/plaid/operations.ts` and
            the `Transaction` entity.

## Phase 4: Frontend Development (React - Core App)

1.  - [ ] **Setup Dashboard Structure**:
    * - [x] Create `src/dashboard/DashboardPage.tsx` as the main dashboard
            container.
    * - [x] Create `src/dashboard/components/spending-metrics.tsx`:
      * - [x] Fetch and display Today/Week/Month spending summaries using
              `getSpendingSummary`.
      * - [x] Include percentage change display.
      * - [x] Implement basic loading/error states.
    * - [x] Create `src/dashboard/components/monthly-spending-chart.tsx`
            (placeholder/basic structure).
    * - [x] Create `src/dashboard/components/category-spending.tsx`
            (implemented).
    * - [x] Create `src/dashboard/components/plaid-integration.tsx`
2.  - [x] **Implement Dashboard Components**:
    * - [x] **Monthly Spending Chart**: Integrate a charting library (e.g.,
            Recharts) in `monthly-spending-chart.tsx` to display data from
            `getMonthlySpending`.
    * - [x] **Category Spending**: Display top categories from
            `getCategorySpending` in `category-spending.tsx`.
    * - [x] **Styling**: Apply consistent styling using Tailwind/shadcn.
      * - [x] Added category-specific color variables and applied to summary
              progress bars.
3.  - [x] **Transactions Page (`src/transactions/TransactionsPage.tsx`)**:
          _(Refactored and Enhanced)_
    * - [x] Uses `getAllTransactions`.
    * - [x] Component Refactor: Moved display logic to `TransactionsList`
            component.
    * - [x] State Management: Handles search, filter (category), and sort state
            in `TransactionsPage`.
    * - [x] UI Controls: Implemented `Input`, `DropdownMenu` (filter), and
            `DropdownMenu` (sort) for interaction.
    * - [x] Filtering & Sorting: Logic implemented in `TransactionsList` based
            on props.
    * - [x] Grouping: Transactions grouped by date periods in
            `TransactionsList`.
    * - [x] Animations: `framer-motion` used for group expansion and item
            appearance in `TransactionsList`.
    * - [x] Multi-Expand & Auto-Expand: Groups allow multi-selection and
            auto-expand on filter/search.
    * - [x] ~~Displays data in a `shadcn/ui` Table.~~ (Replaced with custom
            list)
    * - [x] Implement pagination.
    * - [x] _(Deferred)_ Add subscription check.
4.  - [x] **Routing**: Define routes in `main.wasp` for Dashboard,
          TransactionsPage, Login/Signup, etc.
5.  - [x] **Plaid Link Integration (User Flow)**:
    * - [x] Determine where the "Connect Bank" flow should live (e.g., dedicated
            settings page, initial onboarding, button on dashboard if no
            institutions exist).
    * - [x] _Current `PlaidLinkButton` exists in `src/landing/components/` -
            Needs integration into the main app flow._
    * - [x] Ensure `refetchInstitutions` is called after successful connection.
6.  - [ ] **Institution Management/Syncing**: _(Review/Refine)_
    * - [x] _Current sync button exists on `LandingPage.tsx` - Needs integration
            into the main app flow (e.g., settings or dashboard institution
            list)._
    * - [x] Added functionality to **delete** an institution via the dashboard
            (`plaid-integration.tsx`) with a confirmation dialog and backend
            action (`deleteInstitution`).
    * - [x] Provide clear feedback during sync.

## Phase 5: Stripe Payments Integration (Backend & Frontend) - **In Progress**

_(All steps in this phase are deferred until after Phase 4 is complete)_

1.  - [x] **Setup Stripe**:
    * - [x] Create Stripe account and get API keys (Test keys first). Store
            securely (`.env.server`).
    * - [x] Install Stripe Node client: `npm install stripe`
    * - [x] Create a Product and Price ($4.99/month recurring) in the Stripe
            Dashboard. Store Price ID in `.env.server`.
2.  - [x] **Create Stripe Server Actions (`src/stripe/operations.ts`)**:
    * - [x] `createCheckoutSession`: Fetches `STRIPE_PRICE_ID` from env. Calls
            `_createStripeCheckoutSession` service.
    * - [x] `createCustomerPortalSession`: Uses `user.stripeCustomerId`. Calls
            `_createStripeCustomerPortalSession` service.
3.  - [x] **Implement Stripe Webhook Handler (`src/stripe/webhooks.ts`)**:
    * - [x] Create Wasp API endpoint (`api stripeWebhook` in `main.wasp`) with
            `handleStripeWebhook` function.
    * - [x] Configure `express.raw` middleware via
            `stripeWebhookMiddlewareConfigFn`.
    * - [x] Configure webhook locally using `stripe listen` and
            `STRIPE_WEBHOOK_SECRET`.
    * - [x] Handle `checkout.session.completed`,
            `customer.subscription.updated`, `customer.subscription.deleted`
            events.
    * - [x] Update `User.subscriptionStatus` via `prisma.user.update`.
4.  - [x] **Declare Stripe Actions/API in `main.wasp`**: Expose
          `createCheckoutSession`, `createCustomerPortalSession` as Wasp Actions
          and declare the `stripeWebhook` API endpoint.
5.  - [x] **Frontend Payment Integration (`src/SubscriptionPage.tsx`)**:
    * - [x] Create `SubscriptionPage` and `/subscription` route.
    * - [x] Create `CheckoutResultPage` and `/checkout` route for redirects.
    * - [x] Add "Subscribe Now" button calling `createCheckoutSession` action
            and redirecting to Stripe Checkout URL.
    * - [x] Add "Manage Subscription" button (visible if subscribed) calling
            `createCustomerPortalSession` action and redirecting to Stripe
            Billing Portal.
    * - [x] Display current subscription status using `useAuth`.

## Phase 6: Connecting & Refinement

1.  - [ ] **Connect UI & Logic**: Ensure all `useQuery` and `useAction` hooks
          are correctly implemented, handling loading and error states
          gracefully, especially around subscription status checks.
2.  - [x] **Styling**: Apply CSS/styling to match the mockups (e.g., using
          Tailwind CSS if preferred).
3.  - [x] **Transaction Sync Strategy**:
    * - [x] Implement an initial sync after Plaid Link success.
    * - [x] Implement daily sync on user login (if not synced in last 24h)
            triggered from `RootPage.tsx` calling modified `syncTransactions`.
    * - [x] _Removed: Manual \"Sync Now\" button per institution._
    * - [ ] _(Deferred)_ Set up a Wasp Job (`jobs` in `main.wasp`) for less
            frequent background syncs (if needed). (won't do this for now)
    * - [ ] _(Deferred)_ Implement Plaid Webhooks for real-time updates.
4.  - [ ] **Testing**: Thoroughly test:
    * - [x] Authentication flow.
    * - [x] Stripe Checkout flow (using Test cards).
    * - [x] Stripe Webhook handling (using Stripe CLI).
    * - [x] Stripe Customer Portal access.
    * - [x] Subscription status checks and access control.
    * - [x] Plaid Link connection process (using Sandbox credentials).
    * - [ ] Data fetching and display accuracy (summaries, charts, categories,
            transactions).
    * - [ ] Error handling (e.g., Plaid API errors, Stripe API errors, token
            expiration).
5.  - [ ] **Deployment**: Follow Wasp deployment guides. Ensure environment
          variables (especially Plaid & Stripe secrets, database URL, Stripe
          webhook secret) are configured correctly in the production
          environment.
