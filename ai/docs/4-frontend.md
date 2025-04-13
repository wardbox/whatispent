# Phase 4: Frontend Development

## Summary of Progress

### Dashboard Core Components

- **`DashboardPage.tsx` Created:**

  - Established the main entry point for the authenticated user dashboard at
    `src/dashboard/DashboardPage.tsx`.
  - Renders `SpendingMetrics` and `MonthlyComparisonChart` components.
  - Includes `Tabs` for selecting time range (1M, 3M, 6M, 1Y) for the chart.
  - Manages the `timeRange` state and passes it down to
    `MonthlyComparisonChart`.

- **`SpendingMetrics` Component
  (`src/dashboard/components/spending-metrics.tsx`):**

  - Fetches spending summary data using the `getSpendingSummary` query
    (`useQuery` hook).
  - Displays spending totals for "Today", "This Week", and "This Month".
  - Includes percentage change calculation and display (comparing to the
    previous period) based on the updated `getSpendingSummary` query results.
  - Implements loading state placeholders and basic error handling for the
    query.
  - Uses `framer-motion` for basic animations.
  - Uses `lucide-react` for icons.

- **`MonthlyComparisonChart` Component
  (`src/dashboard/components/monthly-comparison-chart.tsx`):**

  - Fetches monthly or daily spending data using the `getMonthlySpending` query.
  - Accepts a `timeRange` prop from `DashboardPage.tsx`.
  - Dynamically adjusts the query parameters (`months`, `granularity`) based on
    the selected `timeRange`.
  - Displays daily spending for the '1M' view and monthly spending for '3M',
    '6M', and '1Y' views.
  - Uses `recharts` (`LineChart`, `Line`, etc.) and `shadcn/ui` chart components
    (`ChartContainer`, `ChartTooltipContent`) to render a line chart of spending
    trends.
  - Formats axis labels and tooltips appropriately for daily or monthly views.
  - Includes loading and error states.

- **`CategorySummary` Component
  (`src/dashboard/components/category-summary.tsx`):**
  - Fetches aggregated spending data for the **current month** using the
    `getCategorySpending` query.
  - Calculates total spending for the month and the percentage contribution of
    each category.
  - Displays the top 5 categories by spending amount.
  - Shows a pretty category name (from `src/utils/categories.ts`), formatted
    total amount, percentage, and a horizontal progress bar for each.
  - Progress bars are dynamically colored based on the category using CSS
    variables defined in `src/root/Root.css`.
  - Uses `framer-motion` for animations and handles loading/error/empty states.
  - Category name mapping and helper functions moved to a shared utility file
    (`src/utils/categories.ts`).

### Plaid Integration (`src/dashboard/components/plaid-integration.tsx`)

- **Component Created & Wired:**
  - Replaced placeholder/mock data with live data fetching.
  - Uses the `getInstitutions` query to fetch connected bank institutions.
  - Displays a loading state while fetching institutions.
  - Shows an error message if the query fails.
  - Integrates the `PlaidLinkButton` component (moved from `src/landing/components/` to `src/dashboard/components/`).
  - If no institutions are connected, it displays the `PlaidLinkButton` to initiate the connection flow.
  - If institutions are connected, it lists each institution by name and shows the number of linked accounts.
  - The `PlaidLinkButton` is also shown in the connected state to allow adding more institutions.
  - Uses `createLinkToken` and `exchangePublicToken` actions for the Plaid Link flow.
  - Implemented an `onSuccess` callback in `PlaidLinkButton` to trigger `refetchInstitutions` after a new bank is successfully linked, automatically updating the list.

- **Delete Institution Functionality:**
  - Added a delete button (using `@phosphor-icons/react`) next to each institution.
  - Implemented a `shadcn/ui AlertDialog` to confirm the deletion action.
  - Clicking the confirmation button triggers the `deleteInstitution` Wasp action on the backend.
  - The backend action deletes the institution, its accounts, and all associated transactions.
  - Provides user feedback via `sonner` toasts (success/error) and loading states.
  - Automatically refreshes the institution list upon successful deletion.

- **Backend Updates for Balance:**
  - Modified `schema.prisma`: Added `currentBalance` (Float, optional) to the `Account` model.
  - Updated `exchangePublicToken` action (`src/plaid/operations.ts`): Now fetches and saves the `currentBalance` when initially linking an institution.
  - Updated `syncTransactions` action (`src/plaid/operations.ts`): Added a call to fetch latest balances (`_internalFetchBalances`) for all accounts within the institution during transaction sync and updates the `currentBalance` in the database.
  - Updated `getInstitutions` query (`src/plaid/operations.ts`): Now selects and returns the `currentBalance` for each account.

### Development Notes & Next Steps

- **Subscription Checks Deferred:** Implementation of subscription status checks
  (`getUserSubscriptionStatus` query) to restrict access is currently
  **deferred** until after core frontend features are built. Stripe integration
  (Phase 5) will follow Phase 4.
- **Styling:** Basic styling is applied using Tailwind CSS classes and
  conventions from `shadcn/ui` (e.g., `text-muted-foreground`).
- **Placeholders:** Plaid Integration/Bank Connection UI still needs
  implementation.
- **Next:** Integrate the Plaid Link flow for connecting bank accounts.
- **Next:** Implement functionality for managing connected institutions (e.g., manual sync trigger per institution, remove institution).
