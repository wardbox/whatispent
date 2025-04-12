# Phase 3: Backend Logic (Data Queries) & Frontend Refactor

## Summary of Progress (Phase 3, Step 1 & Related Frontend)

### Backend Data Queries

- **Implemented Core Queries:**
    - Defined Wasp queries `getSpendingSummary`, `getMonthlySpending`, `getCategorySpending`, and `getAllTransactions` within `src/plaid/operations.ts`. These queries fetch and aggregate transaction data specifically for the logged-in user.
    - Calculations include summaries for today/week/month, monthly spending trends, and spending breakdowns by category.
    - Ensured queries only consider non-pending expenses (negative amounts).
- **File Structure Correction:**
    - Initially placed queries in `src/queries.ts`, but relocated them to `src/plaid/operations.ts` to centralize Plaid-related backend logic. `src/queries.ts` now only holds non-Plaid-specific queries like `getUserSubscriptionStatus`.
- **Wasp Declaration:**
    - Updated `main.wasp` to declare the new queries, correctly linking them to the functions exported from `@src/plaid/operations.ts` and associating them with the `Transaction` entity.
- **Dependency Fix:**
    - Resolved runtime errors related to `dayjs` plugins (`weekOfYear`, `utc`) by correcting the import statement for `weekOfYear` and adding the `.js` extension to both plugin import paths (e.g., `dayjs/plugin/weekOfYear.js`).

### Plaid Link Frontend Refactor (Related to Phase 5, Step 2)

- **Problem:** The initial approach of fetching the Plaid `linkToken` in a `useEffect` hook within `LandingPage.tsx` caused issues with dependency arrays and potential infinite loops when including the `createLinkToken` action.
- **Solution:** Refactored the flow to be more user-initiated and robust:
    - **Removed Token Fetch from `LandingPage`:** Deleted the `useEffect`, `linkToken` state, and `onSuccess` callback from `LandingPage.tsx`.
    - **Enhanced `PlaidLinkButton`:**
        - The component now receives the `createLinkToken` and `exchangePublicToken` functions directly as props (instead of `token` and `onSuccess`).
        - Removed the dependency on `useAction` hook in `LandingPage.tsx`.
        - On button click, `PlaidLinkButton` now calls `createLinkToken`.
        - Upon receiving the token, it initializes the Plaid Link handler (`window.Plaid.create`) and opens the modal (`handler.open()`).
        - The call to `exchangePublicToken` happens within the Plaid Link configuration's `onSuccess` callback, managed internally by `PlaidLinkButton`.
        - Manages its own internal `isLoading` and `error` states for the entire link flow.
    - **Type Safety:** Corrected the prop types in `PlaidLinkButtonProps` to use explicit function signatures for the action props, resolving potential TypeScript mismatches.

### Backend Enhancements (Queries & Actions)

- **`getInstitutions` Query:**
    - Created a new Wasp query `getInstitutions` in `src/plaid/operations.ts`.
    - Initially fetched basic institution details (name, last sync).
    - Later enhanced to `include` associated `Account` details (name, mask, type, subtype) using Prisma relations.
    - Defined and exported a specific return type `TransactionWithDetails` for type safety on the frontend.
    - Declared the query in `main.wasp`, linking it to the `Institution` entity.
- **`getAllTransactions` Query Enhancement:**
    - Modified the existing `getAllTransactions` query in `src/plaid/operations.ts`.
    - Used Prisma's `include` to fetch related `Account` name and the `Institution` name associated with each transaction.
    - Updated the return type to `TransactionWithDetails[]` to reflect the included data.
- **`syncTransactions` Action Update:**
    - Corrected a type mismatch in the `upsert` logic within `syncTransactions`. Ensured the `category` field was always assigned as `string[]` (e.g., `[primaryCategory]` or `[]`) to match the Prisma schema, resolving TypeScript errors.
    - Updated the action to map Plaid's `personal_finance_category.primary` to the `category` array and include `personal_finance_category_icon_url` (assuming it exists in the Plaid response and schema).

### Frontend Implementation (Landing & Transactions Pages)

- **Institution & Account Listing (`LandingPage.tsx`):**
    - Used the `getInstitutions` query with `useQuery` to fetch and display connected institutions and their nested accounts.
    - Added loading and error states for the query.
    - Used `dayjs` with the `relativeTime` plugin to display the "Last sync" time user-friendly.
    - Conditionally rendered the list or a prompt to connect the first account.
- **Manual Sync Button (`LandingPage.tsx`):**
    - Added a "Sync Now" button for each listed institution.
    - Imported and used the `syncTransactions` Wasp action via the `useAction` hook.
    - Implemented `handleSync` function to call the action, manage loading state (`syncingInstitutionId`), display success/error `toast` notifications (using `sonner`), and `refetch` the `getInstitutions` query upon completion to update the UI.
- **Transactions Page (`src/client/TransactionsPage.tsx`):**
    - Created a new page component `TransactionsPage.tsx`.
    - Added a new route `/transactions` pointing to this page in `main.wasp`.
    - Fetched transaction data using the enhanced `getAllTransactions` query.
    - Displayed transactions in a table (`shadcn/ui` `Table` component).
    - Included columns for Date, Name, Category (with icon if available), Account Name, Institution Name, Amount (formatted), and Status (using `shadcn/ui` `Badge` component).
    - Handled loading, error, and empty states.
- **UI Component Setup:**
    - Added the `badge` and `table` shadcn/ui components to the project using `npx shadcn-ui@latest add`.
    - Corrected import paths for UI components and the exported `TransactionWithDetails` type in `TransactionsPage.tsx`.

### Spending Summaries Display & Logic Correction

- **Frontend Display (`LandingPage.tsx`):**
    - Imported and utilized `getSpendingSummary`, `getMonthlySpending`, and `getCategorySpending` queries using `useQuery`.
    - Added `shadcn/ui` `Card` components to display the fetched spending data (summary, monthly breakdown, top categories) below the institution list.
    - Implemented loading and error states for these queries.
    - Added a `formatCurrency` helper function for consistent display.
- **Backend Logic Correction (`src/plaid/operations.ts`):**
    - **Identified Discrepancy:** Realized that Plaid transaction data uses **positive** amounts for expenses/debits, contrary to the initial assumption.
    - **Corrected Filters:** Updated the `where` clause in `getSpendingSummary`, `getMonthlySpending`, and `getCategorySpending` queries to filter for expenses using `amount: { gt: 0 }` instead of the incorrect `lt: 0`.
    - Removed temporary debugging `console.log` statements added during troubleshooting.
