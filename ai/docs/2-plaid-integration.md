# Phase 2: Plaid Integration Backend Summary

This document summarizes the backend implementation for Plaid integration within
the "What I Spent" Wasp application.

## Goals Achieved:

1.  **Established Plaid Backend Structure:**
    - Created a dedicated `src/plaid/` directory.
    - Implemented `src/plaid/client.ts` to initialize the Plaid API client using
      environment variables (`PLAID_CLIENT_ID`, `PLAID_SECRET`, `PLAID_ENV`).
    - Implemented `src/plaid/utils/encryption.ts` with `encrypt` and `decrypt`
      functions using Node.js `crypto` (AES-256-GCM) to secure Plaid access
      tokens, requiring `ENCRYPTION_KEY` in `.env.server`.
    - Implemented `src/plaid/service.ts` containing internal logic
      (`_internalCreateLinkToken`, `_internalExchangePublicToken`,
      `_internalFetchTransactions`) that interacts with the Plaid API via the
      client and uses the encryption/decryption utilities.
      `_internalExchangePublicToken` fetches accounts and encrypts the
      `access_token`. `_internalFetchTransactions` decrypts the token and
      handles pagination.
    - Implemented `src/plaid/operations.ts` defining Wasp Actions
      (`createLinkToken`, `exchangePublicToken`, `syncTransactions`) as the
      backend interface. These actions handle user context, call service
      functions, interact with the database (`context.entities`), and manage
      data mapping/validation.
    - Added `dayjs` dependency for date manipulation in `syncTransactions`.

2.  **Implemented Core Plaid Actions:**
    - `createLinkToken`: A Wasp Action (requires auth, takes no args) that calls
      the service to get a `link_token` from Plaid.
    - `exchangePublicToken`: A Wasp Action (requires auth, takes
      `{ publicToken }`) that calls the service to exchange the `public_token`,
      get account details, encrypt the `access_token`, and save the connection
      (`Institution`) and related `Account` records.
    - `syncTransactions`: A Wasp Action (requires auth, takes
      `{ institutionId, startDate? }`) that fetches transactions from Plaid via
      the service for a given institution since the last sync (or a specified
      date), maps them to internal account IDs, upserts them into the
      `Transaction` table, and updates the `lastSync` timestamp on the
      `Institution`.

3.  **Declared Wasp Components:**
    - Declared the `createLinkToken`, `exchangePublicToken`, and
      `syncTransactions` actions in `main.wasp`, linking them to their
      implementations and specifying necessary entity access
      (`entities: [Institution, Account, Transaction]`).

4.  **Updated Database Schema:**
    - Added `plaidInstitutionId` (optional String) to the `Institution` model in
      `schema.prisma`.
    - Ran `wasp db migrate-dev` to apply the schema change.

## Current State:

- The backend logic for initiating Plaid Link (`createLinkToken`), handling the
  public token exchange/secure storage (`exchangePublicToken`), fetching
  transactions (`_internalFetchTransactions`), and syncing/storing transactions
  (`syncTransactions`) is complete.
- The necessary actions are defined in `main.wasp` with appropriate entity
  access.
- The database schema (`Institution`, `Account`, `Transaction` models) supports
  storing the necessary Plaid connection details and transaction data securely.

## Frontend Implementation (Vanilla JS Approach):

- **Problem:** The `react-plaid-link` package caused persistent
  `ReferenceError: exports is not defined` errors in the Wasp/Vite environment,
  likely due to CommonJS/ESM module conflicts that standard Vite configurations
  (`optimizeDeps`, `vite-plugin-commonjs`) couldn't resolve.
- **Solution:** Switched to Plaid's vanilla JavaScript integration method as
  documented at
  [https://plaid.com/docs/link/web/](https://plaid.com/docs/link/web/).
  - Uninstalled `react-plaid-link` (`npm uninstall react-plaid-link`).
  - Added the Plaid Link initialization script
    (`<script src='https://cdn.plaid.com/link/v2/stable/link-initialize.js'></script>`)
    directly to the `head` in `main.wasp`.
  - Created a dedicated `src/landing/components/PlaidLinkButton.tsx` component.
  - This component uses `window.Plaid.create()` inside a `useEffect` hook
    (dependent on the `linkToken`) to initialize the Link handler.
  - The `PlaidLinkButton` manages its own state for readiness and errors,
    receives the `linkToken` and callbacks (`onSuccess`, `onExit`, `onEvent`) as
    props, and handles opening the Link flow via the created handler.
  - The parent component (`src/landing/LandingPage.tsx`) fetches the `linkToken`
    using the `createLinkToken` Wasp Action and passes it (and the `onSuccess`
    callback) down to `PlaidLinkButton`.

## Next Steps (Phase 3):

- Implement Wasp Queries (`src/queries.ts`) for fetching aggregated financial
  data (e.g., `getSpendingSummary`, `getMonthlySpending`).
- Declare these queries in `main.wasp`.
