# What I Spent - Product Requirements Document (PRD)

## 1. Introduction

What I Spent is a personal finance application designed to provide users with a
clear and simple overview of their spending habits. By connecting to their bank
accounts via `Plaid`, users can automatically import transactions and gain
insights into where their money is going on a daily, weekly, and monthly basis.
Access to the service requires a monthly subscription.

## 2. Goals

- Provide users with an immediate, easy-to-understand summary of their recent
  spending.
- Visualize spending trends over time through monthly comparisons.
- Offer a categorized breakdown of expenditures.
- Enable seamless and secure bank account integration for automatic transaction
  tracking.
- Implement a secure and reliable subscription payment system.
- Maintain a clean, intuitive, and minimalist user interface.

## 3. Features

### Dashboard Summary:

- Display total amount spent **"Today"**.
- Display total amount spent **"This Week"** (potentially with a comparison
  percentage to the previous week).
- Display total amount spent **"This Month"** (potentially with a comparison
  percentage to the previous month).

### Monthly Comparison Chart:

- Display a line chart visualizing total spending for each of the past 6 months
  (default view).
- Include options to toggle the view between **1 Month**, **3 Months**, **6
  Months**, and **1 Year**.
- The X-axis represents the months.
- The Y-axis represents the total amount spent in dollars.

### Spending Categories:

- Display a list of spending categories derived from imported transactions
  (e.g., Housing, Food & Dining, Shopping).
- For each category, show the total amount spent within the current month.
- Show the percentage contribution of each category to the total monthly
  spending.
- Provide a link to view **"All transactions"**.

### Transaction List:

- (Accessible via **"All transactions"** link) Display a detailed list of all
  imported transactions.
- Each transaction entry should include: Date, Merchant/Description, Amount, and
  Category.
- Allow basic filtering or sorting (e.g., by date range, category - optional
  initial feature).

### Bank Connection (`Plaid`):

- Provide a clear call-to-action (e.g., `"Connect Bank"` button) to initiate the
  bank connection process.
- Integrate the `Plaid Link` module to guide the user through selecting their
  institution and authenticating.
- Securely handle the `Plaid` integration flow to obtain necessary permissions
  and tokens for transaction fetching.
- Automatically fetch and store transactions from connected accounts upon
  successful linking and periodically thereafter.

### Subscription & Payments (`Stripe`):

- Require users to subscribe for $4.99/month to access the application features
  after an initial signup/trial period (if applicable).
- Integrate `Stripe Checkout` for handling the subscription process securely.
- Provide a user interface for managing subscription status (e.g., view current
  plan, update payment method, cancel subscription) via Stripe's customer
  portal.
- Restrict access to core features (Dashboard, Categories, Transactions, Plaid
  connection) based on active subscription status.

## 4. Non-Functional Requirements

- **Usability**: The application must be intuitive and easy to navigate,
  requiring minimal learning curve, including the subscription process.
- **Security**: All sensitive data, particularly `Plaid` API keys, access
  tokens, and `Stripe` keys/secrets, must be stored and handled securely
  following industry best practices. User data privacy and payment security are
  paramount.
- **Data Accuracy**: Calculations for spending summaries and category breakdowns
  must be accurate based on the imported transaction data.
- **Payment Reliability**: Stripe integration must reliably handle subscription
  creation, recurring payments, and status updates.

## 5. Future Considerations

- Manual transaction entry.
- Budgeting features and goal setting.
- Customizable spending categories.
- Advanced reporting and data export.
- Push notifications for large transactions or budget alerts.
