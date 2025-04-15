# Phase 6: Connecting & Refinement Summary

## Daily Transaction Sync on Login

Implemented a mechanism to automatically sync user transactions once per day
upon login to minimize Plaid API costs while keeping data reasonably fresh.

**Changes:**

1.  **Schema Update (`schema.prisma`):**

    - Added an optional `lastSyncedAt` field (`DateTime?`) to the `User` model
      to track the timestamp of the last successful bulk sync triggered for the
      user.

2.  **Backend Action Modification (`src/plaid/operations.ts`):**

    - Modified the `syncTransactions` Wasp Action.
    - Made the `institutionId` parameter optional in the action's payload
      (`SyncTransactionsPayload`).
    - **Single Institution Sync:** If `institutionId` is provided, the action
      syncs only that specific institution (existing behavior, moved to
      `_syncSingleInstitution` helper). Updates `Institution.lastSync`.
    - **Bulk User Sync:** If `institutionId` is _not_ provided (triggered by
      passing `{}` from the client), the action:
      - Fetches all institutions associated with the logged-in user.
      - Iterates through each institution, calling the internal
        `_syncSingleInstitution` helper to sync its transactions and update its
        individual `Institution.lastSync` timestamp.
      - Catches errors for individual institution syncs to allow the bulk
        process to continue.
      - After attempting all institutions, updates the `User.lastSyncedAt`
        timestamp.
    - Uses `createMany` with `skipDuplicates: true` for efficient upserting of
      transactions.

3.  **Frontend Trigger Logic (`src/root/RootPage.tsx`):**
    - Added a `useEffect` hook that runs when the `user` object (from
      `useSubscriptionStatus` -> `useAuth`) changes.
    - Checks if the user exists, has an 'active' subscription status, and if
      `user.lastSyncedAt` is null or older than 24 hours.
    - If conditions are met, it calls the `syncTransactions({})` action
      (imported directly from `wasp/client/operations`) to initiate the bulk
      sync process for the user.
    - Uses the custom `useToast` hook (`src/hooks/use-toast.ts`) to display
      non-blocking error messages if the background sync fails.

**Outcome:**

- Transactions for active users are automatically synced in the background
  shortly after they log in, but only if they haven't been synced within the
  last 24 hours.
- This balances data freshness with Plaid API cost considerations.
- Individual institution sync status is still tracked via
  `Institution.lastSync`.
- User-level sync attempt status is tracked via `User.lastSyncedAt`.

## Landing Page Staggered Animations

Implemented staggered entrance animations for the elements on the landing page
using Framer Motion for a more polished look.

**Changes:**

1.  **Variant Consistency (`src/motion/transitionPresets.tsx`):**

    - Standardized the main animation state keys in `staggerContainer` and
      `staggerItem` variants to use `initial` and `animate` (instead of `hidden`
      and `show`) for better consistency with other variants like `fadeIn` and
      `slideInUp`.

2.  **Animation Structure (`src/landing/LandingPage.tsx`):**
    - Removed animation controls from the root `div`.
    - Applied the `staggerContainer` variant to the `motion.section` element,
      making it the controller for the staggered animation.
    - Wrapped the `h1` and `p` tags within the section in `motion.h1` and
      `motion.p`.
    - Applied the `slideInUp` variant (imported from `transitionPresets.tsx`) to
      the `motion.h1`, `motion.p` tags, and the `motion.div` containing the
      buttons.
    - Ensured the `initial` and `animate` props on the `motion.section` matched
      the keys used in the `staggerContainer` variant (`initial='initial'`,
      `animate='animate'`).
    - Resolved import conflicts between `transitionPresets.ts` and
      `transitionPresets.tsx` by consistently importing variants from the `.tsx`
      file.

**Outcome:**

- The heading, paragraphs, and buttons on the landing page now animate in
  sequentially with a slide-up effect when the page loads.
- The animation logic is contained within the `LandingPage` component and uses
  shared variants from `transitionPresets.tsx`.
