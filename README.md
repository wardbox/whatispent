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

1.  **Install Wasp**: If you haven't already, install Wasp:

    ```bash
    curl -sSL https://get.wasp-lang.dev/installer.sh | sh
    ```

    Follow the instructions provided by the installer.

2.  **Clone or Use Template**: Click "Use this template" or clone the
    repository:

    ```bash
    git clone <repository-url>
    cd <repository-directory>
    ```

3.  **Install Dependencies**: Run `wasp start db` `wasp db migrate-dev`

4.  **Environment Variables (`.env.server`)**:

    - Create a `.env.server` file in the project root.
    - **Plaid**: Add your Plaid API keys (use **Sandbox** keys for local
      development, obtainable from
      [Plaid Dashboard](https://dashboard.plaid.com/)):
      ```env
      PLAID_CLIENT_ID=your_plaid_client_id
      PLAID_SECRET_KEY_SANDBOX=your_plaid_sandbox_secret
      # PLAID_ENV=sandbox (Optional, depending on client implementation)
      ```
    - **Stripe**:
      - Get API keys from [Stripe Dashboard](https://dashboard.stripe.com/).
      - Create a **Product** (e.g., "What I Spent Standard") and a **Price**
        (e.g., $4.99/month recurring) in your Stripe Dashboard. Copy the **Price
        ID** (it looks like `price_xxx`).
      - Add the keys and Price ID to `.env.server`:
      ```env
      STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
      STRIPE_PRICE_ID=price_your_stripe_price_id
      ```
    - **Encryption Key**: Generate a secret key for encrypting Plaid access
      tokens:
      ```bash
      # Run this in your terminal and copy the output
      node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
      ```
      Add the generated key to `.env.server`:
      ```env
      ENCRYPTION_KEY=your_generated_32_byte_hex_key
      ```
    - **Database**: Ensure your database URL is set (Wasp usually handles this
      via `DATABASE_URL` in `.env.server` if not using the default SQLite or
      managed Postgres):
      ```env
      # Example for external Postgres:
      # DATABASE_URL="postgresql://user:password@host:port/dbname"
      ```
    - **Client URL**: Add the base URL of your frontend application for Stripe
      redirects:
      ```env
      CLIENT_URL="http://localhost:3000"
      ```

5.  **Database Setup**:

    - Run migrations:
      ```bash
      wasp db migrate-dev
      ```
    - _(Optional)_ If using Wasp's built-in local Postgres development database
      (requires Docker), you might need `wasp db start` first. This is often not
      needed if you let `wasp start` manage it or use SQLite/external DB.

6.  **Stripe Webhook (Local Testing)**:

    - Install the [Stripe CLI](https://stripe.com/docs/stripe-cli).
    - Run the following command in a separate terminal to forward webhooks to
      your local Wasp app (adjust port/path if your Wasp setup differs):
      ```bash
      stripe listen --forward-to http://localhost:3001/api/stripe-webhooks
      ```
    - The command will output a webhook signing secret (looks like `whsec_xxx`).
      Add this to your `.env.server`:
      ```env
      STRIPE_WEBHOOK_SECRET=whsec_your_stripe_webhook_secret
      ```

7.  **Run the App**:
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
