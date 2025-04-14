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
