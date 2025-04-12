# Phase 1: Setup & Core Structure Documentation

## Database Schema (`schema.prisma`)

This section details the definition of the database schema based on the initial implementation plan.

**Summary of Changes:**

1.  **Discussed Requirements**: Reviewed the schema requirements outlined in `ai/plan.md` for Phase 1, Step 3.
2.  **Implemented Schema**: Modified `schema.prisma` to include the necessary models and fields:
    *   **`User` Model Updated**: Added `stripeCustomerId` (optional, unique), `subscriptionStatus` (optional String), and relations `institutions` and `transactions`.
    *   **`Institution` Model Added**: Created to represent a connection to a financial institution via Plaid. Stores `userId`, `accessToken` (to be encrypted in application logic), `itemId` (Plaid's unique ID for the connection), `institutionName`, `lastSync` timestamp, and a relation to `Account`.
        *   _Naming Evolution_: This model was initially named `PlaidItem`, then `PlaidInstitution`, before settling on `Institution` for clarity and consistency.
    *   **`Account` Model Added**: Represents individual bank accounts within an `Institution`. Stores `institutionId` (linking to `Institution`), `plaidAccountId` (Plaid's unique ID for the account), `name`, `mask`, `type`, `subtype`, and a relation to `Transaction`.
    *   **`Transaction` Model Added**: Stores individual transactions. Linked to both `User` and `Account`. Includes `plaidTransactionId` (unique), `amount`, `date`, `merchantName`, `name`, `category` (array), and `pending` status.
    *   **`Note` Model Removed**: The pre-existing `Note` model was removed as it was not part of the application requirements.
3.  **Clarifications**: Discussed the distinction between the `Institution` (representing the overall bank connection) and `Account` (representing specific accounts within that connection) models.

**Encryption Note**: The `accessToken` field in the `Institution` model is stored as a plain `String` in the schema. Encryption and decryption must be handled in the application's server-side logic (e.g., Wasp Actions) before database persistence and after retrieval.
