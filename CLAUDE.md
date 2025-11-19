# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with
code in this repository.

## Project Overview

What I Spent is a personal finance application built with Wasp that helps users
track spending habits through Plaid bank integration and Stripe subscription
management.

## Development Commands

### Wasp Commands

- `wasp start` - Start the development server (runs both client and server)
- `wasp start db` - Start the PostgreSQL database (requires Docker)
- `wasp db migrate-dev` - Run database migrations
- `wasp db studio` - Open Prisma Studio to view/edit database

### Code Quality

- `npm run lint` - Run ESLint
- `npm run lint:fix` - Auto-fix ESLint issues
- `npm run format` - Format code with Prettier
- `npm run check` - Run both format and lint:fix

### Utility Scripts

- `npm run fix-shadcn` - Fix shadcn component imports
- `npm run create-page` - Create a new page with boilerplate

### Stripe Webhooks (Local Development)

```bash
stripe listen --forward-to http://localhost:3001/api/stripe-webhooks
```

## Architecture

### Tech Stack

- **Framework**: Wasp ^0.18.2 (full-stack framework with React + Node.js)
- **Frontend**: React 18, TypeScript, Tailwind CSS, shadcn/ui components
- **Backend**: Node.js with Prisma ORM
- **Database**: PostgreSQL
- **Auth**: Google OAuth (via Wasp)
- **Payments**: Stripe for subscriptions
- **Bank Integration**: Plaid API for transaction data
- **Icons**: @phosphor-icons/react
- **Animations**: motion (not framer-motion)

### Feature-Based Organization

Code is organized by features in the `src/` directory:

```
src/
├── auth/              # Authentication (Google OAuth)
├── dashboard/         # Main spending dashboard
├── transactions/      # Transaction list and management
├── plaid/            # Plaid integration (bank connections, sync)
│   ├── operations.ts  # Actions/queries for Plaid
│   └── service.ts     # Internal Plaid API calls
├── stripe/           # Stripe integration (subscriptions)
│   ├── operations.ts  # Checkout and portal sessions
│   └── webhooks.ts    # Stripe webhook handlers
├── admin/            # Admin panel
├── landing/          # Marketing landing page
├── root/             # Root component (Navbar, Footer)
├── lib/              # Shared utilities and setup
├── utils/            # Helper functions
└── static/           # Static assets
```

Each feature typically contains:

- Page components: `FeaturePage.tsx`
- Operations: `operations.ts` (actions and queries)
- Components: `components/ComponentName.tsx`

### Wasp Architecture

Wasp uses a declarative configuration file (`main.wasp`) that defines:

- **Routes & Pages**: URL routing and page components
- **Actions**: Server-side mutations (e.g., `createLinkToken`,
  `exchangePublicToken`)
- **Queries**: Server-side data fetching (e.g., `getSpendingSummary`,
  `getAllTransactions`)
- **API Endpoints**: Custom HTTP endpoints (e.g., Stripe webhooks)
- **Auth**: Google OAuth configuration
- **Entities**: Referenced from `schema.prisma` (Prisma models)

**Important Workflow**:

1. Define operations in `main.wasp` first
2. Implement them in the feature's `operations.ts` file
3. Expect type errors until implementation is complete
4. Restart Wasp language server after adding operations (Command Palette:
   "Developer: Restart Extension Host")

### Data Model

Key entities (defined in `schema.prisma`):

- **User**: Main user with subscription status, Plaid sync status
- **Institution**: Bank/financial institution connected via Plaid
  - Stores encrypted `accessToken` and `itemId`
  - Has many Accounts
- **Account**: Individual bank account within an institution
  - Has many Transactions
- **Transaction**: Individual spending transaction from Plaid
  - Indexed by `userId`, `accountId`, and `date` for performance

**Encryption**: Plaid access tokens are encrypted using the `ENCRYPTION_KEY`
environment variable.

**Transaction Syncing**: Uses Plaid's modern `/transactions/sync` endpoint with
cursor-based pagination. The cursor is stored in the Institution model to enable
incremental syncing. The sync process handles:

- New transactions (added)
- Transaction corrections/updates (modified)
- Transaction reversals/deletions (removed)

### Plaid Integration Flow

1. User clicks "Connect Bank" → `createLinkToken` action creates Plaid Link
   token
2. Plaid Link UI opens → User authenticates with bank
3. Frontend receives public token → `exchangePublicToken` action exchanges it
   for access token
4. Access token is encrypted and stored in Institution model
5. `syncTransactions` action syncs transactions using modern
   `/transactions/sync` endpoint
6. Transactions are processed:
   - **Added**: New transactions are inserted
   - **Modified**: Existing transactions are updated (e.g., corrected amounts)
   - **Removed**: Deleted/reversed transactions are removed from DB
7. Cursor is stored for incremental syncing

### Stripe Integration Flow

1. User subscribes → `createCheckoutSession` action creates Stripe Checkout
   session
2. User completes payment → Stripe redirects to `/checkout` page
3. Stripe sends webhook → `stripeWebhook` API endpoint updates
   `subscriptionStatus`
4. User can manage subscription → `createCustomerPortalSession` opens Stripe
   portal

## Important Coding Guidelines

### Imports

**Wasp imports** - Always use `wasp` package, never `@wasp`:

```typescript
import { useQuery } from 'wasp/client/operations'
import type { GetEvents } from 'wasp/server/operations'
import { Event } from 'wasp/entities'
```

**React imports** - Do not import React itself (auto-imported):

```typescript
import { useState } from 'react' // ✓ Correct
import React, { useState } from 'react' // ✗ Wrong
```

**Motion imports** - Use `motion/react`, not `framer-motion`:

```typescript
import { motion } from 'motion/react' // ✓ Correct
import { motion } from 'framer-motion' // ✗ Wrong
```

**No @ alias** - Use relative imports only in src code (@ is not configured).

### TypeScript

- Use `satisfies` keyword for operation typing:

```typescript
export const getEvents = (async (_args, context) => {
  return context.entities.Event.findMany()
}) satisfies GetEvents<Event[]>
```

- Use `ReturnType` for typing components receiving query results:

```typescript
export interface EventsPageProps {
  events: Awaited<ReturnType<typeof getEvents>>
}
```

### Database Migrations

**Forward-only migration strategy** - Never rename fields directly:

- Add new field alongside old field
- Update code to write to both fields
- Migrate data from old to new field
- Update code to read from new field (still write to both)
- Finally remove old field after confirming everything works

Example (safe field renaming):

```prisma
// Phase 1: Add new field
model Transaction {
  accountId String?  // Make optional
  userId    String?  // New field
}

// Phase 2 (later): Remove old field
model Transaction {
  userId String  // Now required
}
```

### Forms

Use React Hook Form with Zod validation:

```typescript
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

const formSchema = z.object({
  username: z
    .string()
    .min(2, { message: 'Username must be at least 2 characters.' }),
})

const form = useForm<z.infer<typeof formSchema>>({
  resolver: zodResolver(formSchema),
})
```

### Styling

- Use Tailwind CSS for all styling
- Use semantic color names: `text-destructive` not `text-red-500`
- Follow mobile-first responsive design
- Use `gap` for spacing between elements
- Prefer padding over margins
- Icons: Use `@phosphor-icons/react`
- Code style follows `.prettierrc`:
  - No semicolons
  - Single quotes
  - JSX single quotes
  - 2 space indentation
  - No tabs

### Error Handling in Operations

Always validate user authentication and inputs:

```typescript
if (!context.user) {
  throw new HttpError(401, 'You must be logged in')
}

if (!args.name?.trim()) {
  throw new HttpError(400, 'Name cannot be empty')
}
```

## Environment Variables

Required in `.env.server`:

```env
# Plaid (use Sandbox keys for development)
PLAID_CLIENT_ID=your_plaid_client_id
PLAID_SECRET_KEY_SANDBOX=your_plaid_sandbox_secret
PLAID_WEBHOOK_URL=http://localhost:3001/plaid-webhooks  # For local dev
PLAID_WEBHOOK_VERIFICATION_KEY=  # Get from Plaid Dashboard in production

# Stripe
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PRICE_ID=price_your_stripe_price_id
STRIPE_WEBHOOK_SECRET=whsec_your_stripe_webhook_secret

# Encryption (generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
ENCRYPTION_KEY=your_generated_32_byte_hex_key

# Client
CLIENT_URL="http://localhost:3000"

# Database (optional if using Wasp's default)
DATABASE_URL="postgresql://user:password@host:port/dbname"
```

## Common Patterns

### Using Queries in Components

```typescript
import { useQuery } from 'wasp/client/operations'
import { getSpendingSummary } from 'wasp/client/operations'

const { data, isLoading, error } = useQuery(getSpendingSummary)
```

### Using Actions in Components

```typescript
import { createLinkToken } from 'wasp/client/operations'

const handleConnect = async () => {
  try {
    const linkToken = await createLinkToken()
    // Use linkToken with Plaid Link
  } catch (error) {
    console.error(error)
  }
}
```

### Accessing User Context in Operations

```typescript
export const createSomething = (async (args, context) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authenticated')
  }

  const userId = context.user.id
  // Use context.entities for Prisma queries
  return context.entities.Something.create({
    data: { userId, ...args },
  })
}) satisfies CreateSomething<Args, Result>
```

## Notes

- Don't leave comments in code unless they describe complex logic
- File naming: PascalCase for components (`.tsx`), camelCase for utilities
  (`.ts`)
- Use meaningful class names and semantic HTML
- Keep state as local as possible
- shadcn/ui components are preconfigured and available in `src/components/ui/`
