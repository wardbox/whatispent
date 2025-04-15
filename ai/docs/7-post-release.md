## Plaid Sync Robustness (Handle Balance Fetch Errors)

- Modified `src/plaid/operations.ts` (`_syncSingleInstitution` function) to
  improve robustness during transaction synchronization.
- Separated the fetching of Plaid account balances from the fetching of
  transactions.
- Implemented error handling specifically for the balance fetching step using a
  `try...catch` block.
- If fetching balances fails (e.g., due to API permissions `INVALID_PRODUCT`),
  the error is now logged, but the function proceeds to sync transactions
  without halting the entire process for that institution.
- Added the missing `AccountBase` type import from `'plaid'` to resolve a linter
  error introduced by the change.

## Display Institution Name and Account Mask in Transactions

- **Goal**: Show the institution name and account mask (last 4 digits) for each
  transaction in the transactions list for clarity.
- \*\*Backend (`src/plaid/operations.ts`):
  - Updated the `TransactionWithDetails` type to include `mask: string | null`
    within the nested `account` object.
  - Modified the Prisma query in `getAllTransactions`:
    - Initially confirmed `mask: true` was in the `select` clause for the
      `account` relation.
    - When debugging showed the mask wasn't being returned, changed the query to
      use `include` for the `account` relation instead of `select`. This ensures
      all scalar fields of the account (including `mask`) are fetched, while
      still specifically selecting `institutionName` from the nested
      institution.
    - _Note: This query change required a manual server restart to take effect,
      as hot reload was insufficient._
- \*\*Frontend (`src/transactions/components/transactions-list.tsx`):
  - Updated the transaction row rendering to display
    `{transaction.account.institution.institutionName} • {transaction.account.name}`.
  - Added conditional logic `{transaction.account.mask ? `
    (${transaction.account.mask})` : ''}` to display the mask in parentheses
    only if it exists (is not null or empty).
  - Added and then removed a `console.log` statement during debugging to inspect
    the `transaction.account` data received by the component.

## Feature Updates & Fixes (Post-Release)

- **Plaid Integration Enhancements:**
  - **Extended Initial Sync:** Changed the initial transaction sync period upon
    linking a new institution from the default 30 days to 6 months to provide
    more historical context immediately.
  - **Institution Logos:**
    - Added support for fetching and storing institution logos (as base64
      strings) obtained from Plaid.
    - The logo is now displayed next to the institution name in the "Connected
      Accounts" section on the dashboard.
    - A small version of the institution logo is displayed next to the
      institution name within the transaction list items.
  - **Transaction List UI Refinements:**
    - The main icon for each transaction row now consistently displays the
      relevant _category_ icon.
    - Removed the account mask (e.g., `(1234)`) from the transaction details
      line for a cleaner look.
    - Rearranged the transaction details line: Account name is now displayed on
      the left, and the institution logo/name is grouped on the right.
  - **Sandbox Data:** Investigated transaction history limits; concluded that
    restricted history (e.g., only back to March) is likely due to Plaid Sandbox
    data constraints, as the code correctly requests a 6-month history on
    initial sync.
- **Navigation Enhancements:**
  - Added "Dashboard" and "Transactions" links to the mobile navigation menu for logged-in users (`src/root/components/nav.tsx`).
  - Modified the landing page (`src/landing/LandingPage.tsx`) to conditionally display a "Go to Dashboard" button for authenticated users, replacing the default "Get Started" and "Log In" buttons.
- **Transactions Page UI/UX:**
  - **Responsiveness:** Adjusted the layout of filter and sort buttons on the Transactions page (`src/transactions/TransactionsPage.tsx`) to stack vertically on small screens for better mobile usability.
  - **Cleaner Header:** Removed the redundant "All Transactions" title from the main content area of the Transactions page.
  - **Improved List Item Layout:** Refined the display of individual transaction items (`src/transactions/components/transactions-list.tsx`) on mobile by:
    - Stacking amount and account details vertically on the right.
    - Applying text truncation to prevent overflow.
    - Slightly reducing the category icon size.
    - Hiding the bank institution name on extra-small screens.
  - **Transaction Detail Dialog:**
    - Implemented a dialog (`src/transactions/components/transaction-detail-dialog.tsx`) that appears when a user clicks/taps on a transaction row, displaying detailed information.
    - Styled the dialog using flexbox and typography consistent with dashboard components for a cohesive look.
- **Subscription Page UI:**
  - Vertically centered the subscription plan card on the `SubscriptionPage.tsx` for better presentation on various screen heights.
