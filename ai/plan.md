# What I Spent - Implementation Plan

This plan outlines the steps to build the "What I Spent" application using Wasp, assuming development with the assistance of an LLM coding editor.

## Phase 1: Setup & Core Structure

1.  - [x] **Initialize Wasp Project**:
    *   - [x] Run `wasp new WhatISpent`
    *   - [x] Configure basic project settings if needed.
2.  - [x] **Implement Authentication**:
    *   - [x] Enable Wasp's email/password or other desired auth method in `main.wasp`.
    *   - [x] Create basic Login/Signup pages. All subsequent features will require user authentication.
3.  - [x] **Define Database Schema (`schema.prisma`)**:
    *   - [x] **User**: Default Wasp user model. Add relation to `Institution`. Add `stripeCustomerId` (String, optional, unique) and `subscriptionStatus` (String, optional - e.g., "active", "canceled", "incomplete").
    *   - [x] **Institution** (formerly PlaidItem): Stores details for each linked financial institution.
        *   - [x] `id` (String, CUID)
        *   - [x] `userId` (String - matching User ID type)
        *   - [x] `user` (Relation to User)
        *   - [x] `accessToken` (String - **Must be encrypted in application logic**)
        *   - [x] `itemId` (String, unique - Plaid's Item ID)
        *   - [x] `institutionName` (String)
        *   - [x] `lastSync` (DateTime, optional)
    *   - [x] **Account**: Represents individual accounts within an `Institution`.
        *   - [x] `id` (String, CUID)
        *   - [x] `institutionId` (String - FK to Institution)
        *   - [x] `institution` (Relation to Institution)
        *   - [x] `plaidAccountId` (String, unique - Plaid's Account ID)
        *   - [x] `name` (String)
        *   - [x] `mask` (String)
        *   - [x] `type` (String - e.g., checking, savings, credit)
        *   - [x] `subtype` (String)
    *   - [x] **Transaction**: Stores individual transactions.
        *   - [x] `id` (String, CUID)
        *   - [x] `userId` (String - matching User ID type)
        *   - [x] `user` (Relation to User)
        *   - [x] `accountId` (String)
        *   - [x] `account` (Relation to Account)
        *   - [x] `plaidTransactionId` (String, unique - Plaid's Transaction ID)
        *   - [x] `amount` (Float - Use negative for debits/spending)
        *   - [x] `date` (DateTime - Date of transaction)
        *   - [x] `merchantName` (String, optional)
        *   - [x] `name` (String - Transaction description)
        *   - [x] `category` (String Array - Plaid categories)
        *   - [x] `pending` (Boolean)
4.  - [x] **Run Migrations**:
    *   - [x] `wasp db migrate-dev`

## Phase 2: Plaid Integration (Backend)

1.  - [x] **Setup Plaid**:
    *   - [x] Get Plaid API keys (start with Sandbox). Store securely (e.g., environment variables, `.env.server`).
    *   - [x] Install Plaid Node client: `npm install plaid`
    *   - [x] Install `dayjs` dependency: `npm install dayjs`
2.  - [x] **Create Plaid Service and Wasp Operations (`src/plaid/`)**:
    *   - [x] Create `src/plaid/client.ts`: Initialize and configure the Plaid client using environment variables.
    *   - [x] Create `src/plaid/service.ts`: Implement core Plaid API interaction functions (`_internalCreateLinkToken`, `_internalExchangePublicToken`, `_internalFetchTransactions`). Handle `accessToken` encryption/decryption here or using a utility.
    *   - [x] Create `src/plaid/operations.ts`: Define Wasp Actions (`createLinkToken`, `exchangePublicToken`, `syncTransactions`) that call the service functions and interact with the database. Plaid-related Wasp Queries will also go here later.
    *   - [x] *(Optional but Recommended)* Create `src/server/utils/encryption.ts` for encrypting/decrypting the Plaid `accessToken`. Requires an `ENCRYPTION_KEY` environment variable. (Assuming this was done implicitly or previously)
3.  - [x] **Declare Plaid Actions in `main.wasp`**: Import and declare the Actions (`createLinkToken`, `exchangePublicToken`, `syncTransactions`) from `src/plaid/operations.ts` with necessary `entities`.

## Phase 3: Backend Logic (Data Queries)

1.  - [x] **Create Wasp Queries (`src/plaid/operations.ts`)**: **Completed**
    *   - [x] Moved queries (`getSpendingSummary`, `getMonthlySpending`, `getCategorySpending`, `getAllTransactions`) from `src/queries.ts` to `src/plaid/operations.ts` to keep Plaid logic together.
    *   - [x] Implemented logic to fetch and aggregate transaction data (summaries, monthly, category).
    *   - [x] Ensured queries filter for logged-in user and non-pending expenses.
    *   - [x] `getUserSubscriptionStatus` remains in `src/queries.ts`.
2.  - [x] **Declare Queries in `main.wasp`**: **Completed**
    *   - [x] Declared new queries, linking them to `src/plaid/operations.ts` and the `Transaction` entity.

## Phase 4: Frontend Development (React - Core App)

1.  - [ ] **Setup Dashboard Structure**:
    *   - [x] Create `src/dashboard/DashboardPage.tsx` as the main dashboard container.
    *   - [x] Create `src/dashboard/components/spending-metrics.tsx`:
        *   - [x] Fetch and display Today/Week/Month spending summaries using `getSpendingSummary`.
        *   - [x] Include percentage change display.
        *   - [x] Implement basic loading/error states.
    *   - [ ] Create `src/dashboard/components/monthly-spending-chart.tsx` (placeholder/basic structure).
    *   - [ ] Create `src/dashboard/components/category-spending.tsx` (placeholder/basic structure).
2.  - [ ] **Implement Dashboard Components**:
    *   - [ ] **Monthly Spending Chart**: Integrate a charting library (e.g., Recharts) in `monthly-spending-chart.tsx` to display data from `getMonthlySpending`.
    *   - [ ] **Category Spending**: Display top categories from `getCategorySpending` in `category-spending.tsx`.
    *   - [ ] **Styling**: Apply consistent styling using Tailwind/shadcn.
3.  - [ ] **Transactions Page (`src/client/TransactionsPage.tsx`)**: *(Review/Refine if needed)*
    *   - [x] Uses `getAllTransactions`.
    *   - [x] Displays data in a `shadcn/ui` Table.
    *   - [ ] Implement pagination.
    *   - [ ] *(Deferred)* Add subscription check.
4.  - [ ] **Routing**: Define routes in `main.wasp` for Dashboard, TransactionsPage, Login/Signup, etc.
5.  - [ ] **Plaid Link Integration (User Flow)**:
    *   - [ ] Determine where the "Connect Bank" flow should live (e.g., dedicated settings page, initial onboarding, button on dashboard if no institutions exist).
    *   - [x] *Current `PlaidLinkButton` exists in `src/landing/components/` - Needs integration into the main app flow.* 
    *   - [ ] Ensure `refetchInstitutions` is called after successful connection.
6.  - [ ] **Institution Management/Syncing**: *(Review/Refine)*
    *   - [x] *Current sync button exists on `LandingPage.tsx` - Needs integration into the main app flow (e.g., settings or dashboard institution list).*
    *   - [ ] Provide clear feedback during sync.

*(Subscription checks (`getUserSubscriptionStatus`) are deferred to after core frontend development)*

## Phase 5: Stripe Payments Integration (Backend & Frontend) - *Deferred*

*(All steps in this phase are deferred until after Phase 4 is complete)*

1.  - [ ] **Setup Stripe**:
    *   - [ ] Create Stripe account and get API keys (Test keys first). Store securely (`.env.server`).
    *   - [ ] Install Stripe Node client: `npm install stripe`
    *   - [ ] Create a Product and Price ($4.99/month recurring) in the Stripe Dashboard.
2.  - [ ] **Create Stripe Server Actions (`src/server/stripe.js` or similar)**:
    *   - [ ] `createCheckoutSession`: Takes the user ID and Price ID. Creates a Stripe Customer if one doesn't exist (store `stripeCustomerId` on User). Creates and returns a Stripe Checkout Session URL.
    *   - [ ] `createCustomerPortalSession`: Takes the `stripeCustomerId`. Creates and returns a Stripe Billing Portal Session URL.
3.  - [ ] **Implement Stripe Webhook Handler**:
    *   - [ ] Create a Wasp API endpoint (`api stripeWebhook` in `main.wasp`, function in `src/server/stripe.js`).
    *   - [ ] Configure the webhook endpoint in the Stripe Dashboard.
    *   - [ ] Handle relevant events (e.g., `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`) to update the User's `subscriptionStatus` in the database. Secure the webhook using Stripe signatures.
4.  - [ ] **Declare Stripe Actions/API in `main.wasp`**: Expose `createCheckoutSession`, `createCustomerPortalSession` as Wasp Actions and declare the `stripeWebhook` API endpoint.
5.  - [ ] **Frontend Payment Integration (`src/client/SubscriptionPage.jsx` or similar)**:
    *   - [ ] Create a dedicated page or section for subscription management.
    *   - [ ] Add a "Subscribe Now" button that calls the `createCheckoutSession` action and redirects the user to the Stripe Checkout URL.
    *   - [ ] Add a "Manage Subscription" button (visible if subscribed) that calls the `createCustomerPortalSession` action and redirects the user to the Stripe Billing Portal.
    *   - [ ] Display current subscription status using the `getUserSubscriptionStatus` query.

## Phase 6: Connecting & Refinement

1.  - [ ] **Connect UI & Logic**: Ensure all `useQuery` and `useAction` hooks are correctly implemented, handling loading and error states gracefully, especially around subscription status checks.
2.  - [ ] **Styling**: Apply CSS/styling to match the mockups (e.g., using Tailwind CSS if preferred).
3.  - [x] **Transaction Sync Strategy**:
    *   - [ ] Implement an initial sync after Plaid Link success.
    *   - [x] *Implemented a manual "Sync Now" button per institution on the landing page calling `syncTransactions` action.*
    *   - [ ] _(Advanced)_ Set up a Wasp Job (`jobs` in `main.wasp`) to run `syncTransactions` periodically (e.g., daily).
    *   - [ ] _(Advanced)_ Implement Plaid Webhooks for real-time updates (requires a publicly accessible endpoint and handling webhook events in a Wasp API endpoint).
4.  - [ ] **Testing**: Thoroughly test:
    *   - [ ] Authentication flow.
    *   - [ ] Stripe Checkout flow (using Test cards).
    *   - [ ] Stripe Webhook handling (using Stripe CLI or dashboard events).
    *   - [ ] Stripe Customer Portal access.
    *   - [ ] Subscription status checks and access control.
    *   - [ ] Plaid Link connection process (using Sandbox credentials).
    *   - [ ] Data fetching and display accuracy (summaries, charts, categories, transactions).
    *   - [ ] Error handling (e.g., Plaid API errors, Stripe API errors, token expiration).
5.  - [ ] **Deployment**: Follow Wasp deployment guides. Ensure environment variables (especially Plaid & Stripe secrets, database URL, Stripe webhook secret) are configured correctly in the production environment.
