# What I Spent

A personal finance application designed to provide users with a clear and simple
overview of their spending habits.

## What's this about?

What I Spent helps you understand where your money goes. By securely connecting
to your bank accounts via Plaid, it automatically imports transactions and
provides insights into your spending on a daily, weekly, and monthly basis.
Access requires a monthly subscription managed via Stripe.

This starter aims to provide a solid foundation with:

- Secure bank integration using Plaid.
- Subscription management via Stripe.
- Preconfigured shadcn/ui components.
- Best practices for Wasp development baked in.

## Features

- **Dashboard Summary**: See spending for Today, This Week, and This Month at a
  glance.
- **Monthly Comparison Chart**: Visualize spending trends over the past months.
- **Spending Categories**: Understand spending distribution across categories
  like Food, Shopping, etc.
- **Detailed Transaction List**: View all imported transactions with details.
- **Secure Bank Connection**: Easily link bank accounts using Plaid Link.
- **Subscription Management**: Handle subscriptions securely via Stripe Checkout
  and Customer Portal.

## Getting Started

1.  **Clone or Use Template**: Click "Use this template" or clone the
    repository.
2.  **Install Dependencies**: Run `npm install` (if not using Wasp's install).
3.  **Environment Variables**:
    - Create a `.env.server` file in the project root.
    - Add your Plaid API keys (obtainable from
      [Plaid Dashboard](https://dashboard.plaid.com/)):
      ```env
      PLAID_CLIENT_ID=your_plaid_client_id
      PLAID_SECRET_KEY_SANDBOX=your_plaid_sandbox_secret
      # Add other keys (Development, Production) as needed
      ```
    - Add your Stripe API keys (obtainable from
      [Stripe Dashboard](https://dashboard.stripe.com/)):
      ```env
      STRIPE_SECRET_KEY=your_stripe_secret_key
      STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
      ```
    - Generate and add an encryption key for securing sensitive data (like Plaid
      access tokens):
      ```bash
      # Run this command in your terminal and copy the output
      node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
      ```
      Add the generated key to `.env.server`:
      ```env
      ENCRYPTION_KEY=your_generated_32_byte_hex_key
      ```
    - Ensure your database URL is set (Wasp usually handles this, but verify if
      needed):
      ```env
      DATABASE_URL="postgresql://user:password@host:port/dbname"
      ```
    - (Optional) Create a `.env.client` file if you need client-side environment
      variables (like the public Stripe key, though Wasp often manages passing
      these).
4.  **Database Setup**:
    ```bash
    wasp db start # Only if using local psql, can often be skipped
    wasp db migrate-dev
    ```
5.  **Run the App**:
    ```bash
    wasp start
    ```

Visit the running application (usually `http://localhost:3000`).

## Contributing

We welcome contributions! Whether it's:

- 🐛 Bug fixes
- ✨ New features
- 📝 Documentation improvements
- 💡 Suggestions

Feel free to open an issue or submit a pull request.

## Learn More

- [Documentation](https://roke.dev)
- [Wasp Documentation](https://wasp-lang.dev)
- [shadcn/ui](https://ui.shadcn.com)
- [Motion](https://motion.dev)

## License

MIT License - feel free to use this in your own projects!
