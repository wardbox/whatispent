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
4.  - [ ] **Run Migrations**:
    *   - [ ] `wasp db migrate-dev`

## Phase 2: Plaid Integration (Backend)

1.  - [ ] **Setup Plaid**:
    *   - [ ] Get Plaid API keys (start with Sandbox). Store securely (e.g., environment variables, `.env.server`).
    *   - [ ] Install Plaid Node client: `npm install plaid`
2.  - [ ] **Create Plaid Server Actions/Functions (`src/server/plaid.js` or similar)**:
    *   - [ ] `createLinkToken`: Generates a `link_token` for the frontend Plaid Link component. Requires the `userId`.
    *   - [ ] `exchangePublicToken`: Takes a `public_token` (from frontend), exchanges it for an `access_token` and `item_id`. Stores the `Institution` (encrypting the `access_token`). Fetches initial account info and stores `Accounts`.
    *   - [ ] `fetchTransactions`: Takes an `Institution`'s `accessToken`, fetches recent transactions, and saves/updates them in the `Transaction` table. Handle pagination and deduplication using `plaidTransactionId`.
    *   - [ ] `syncTransactions`: A helper action/job that iterates through user's `Institution`s and calls `fetchTransactions`.
3.  - [ ] **Declare Plaid Actions in `main.wasp`**: Expose the server functions created above as Wasp Actions.

## Phase 3: Backend Logic (Data Queries)

1.  - [ ] **Create Wasp Queries (`src/queries.js` or similar)**:
    *   - [ ] `getSpendingSummary`: Calculates totals for Today, This Week, This Month based on `Transaction` data for the logged-in user.
    *   - [ ] `getMonthlySpending`: Aggregates spending by month for the last N months for the chart.
    *   - [ ] `getCategorySpending`: Aggregates spending by top-level category for the current month.
    *   - [ ] `getAllTransactions`: Fetches all transactions for the user, possibly with pagination.
    *   - [ ] `getUserSubscriptionStatus`: Fetches the `subscriptionStatus` for the logged-in user.
2.  - [ ] **Declare Queries in `main.wasp`**: Expose these queries for frontend use.

## Phase 4: Stripe Payments Integration (Backend & Frontend)

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

## Phase 5: Frontend Development (React - Core App)

1.  - [ ] **Restrict Access Based on Subscription**:
    *   - [ ] On core pages (Dashboard, etc.), use the `getUserSubscriptionStatus` query.
    *   - [ ] If the user doesn't have an active subscription, display a message prompting them to subscribe (linking to the subscription page/flow) instead of the page content.
2.  - [ ] **Setup Plaid Link Frontend**:
    *   - [ ] Install Plaid React component: `npm install react-plaid-link`
    *   - [ ] Create a component (`src/client/PlaidLink.jsx`) that:
        *   - [ ] Calls the `createLinkToken` action.
        *   - [ ] Uses `react-plaid-link` with the obtained token.
        *   - [ ] On success (`onSuccess` callback), calls the `exchangePublicToken` action with the `public_token`.
3.  - [ ] **Create Dashboard Page (`src/client/DashboardPage.jsx`)**:
    *   - [ ] Check subscription status first.
    *   - [ ] Use `useQuery` to fetch data from `getSpendingSummary`, `getMonthlySpending`, and `getCategorySpending`.
    *   - [ ] Display the summary cards (Today, Week, Month).
    *   - [ ] Integrate a charting library (e.g., Recharts, Chart.js) for the Monthly Comparison Chart. Pass data from `getMonthlySpending`. Add timeframe toggles (1M, 3M, 6M, 1Y) which will re-fetch the query with different parameters.
    *   - [ ] Display the Categories list using data from `getCategorySpending`.
    *   - [ ] Include the `PlaidLink` component behind a "Connect Bank" button (ensure it's only active/visible for subscribed users).
4.  - [ ] **Create Transactions Page (`src/client/TransactionsPage.jsx` - Optional)**:
    *   - [ ] Check subscription status first.
    *   - [ ] Use `useQuery` to fetch data from `getAllTransactions`.
    *   - [ ] Display transactions in a table or list format.
    *   - [ ] Implement pagination if needed.
5.  - [ ] **Routing**: Define routes in `main.wasp` for the Dashboard, Login/Signup, Subscription, and potentially the Transactions page.

## Phase 6: Connecting & Refinement

1.  - [ ] **Connect UI & Logic**: Ensure all `useQuery` and `useAction` hooks are correctly implemented, handling loading and error states gracefully, especially around subscription status checks.
2.  - [ ] **Styling**: Apply CSS/styling to match the mockups (e.g., using Tailwind CSS if preferred).
3.  - [ ] **Transaction Sync Strategy**:
    *   - [ ] Implement an initial sync after Plaid Link success.
    *   - [ ] Consider a simple "Sync Now" button calling `syncTransactions`.
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
