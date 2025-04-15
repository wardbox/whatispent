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
