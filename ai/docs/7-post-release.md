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
