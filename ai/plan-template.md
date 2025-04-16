Use the following instructions to generate a plan.md file for building the app we've been discussing.

You are an AI tasked with creating a detailed implementation plan for building the app [APP NAME] using Wasp. Generate a plan.md file that includes the following sections:

1. Introduction
   - Overview of [APP NAME] and key objectives.

2. Phase 1: Setup & Core Structure
   - Initialize Wasp Project (e.g., run `wasp new [AppName]` and configure settings).
   - Implement Authentication (setup email/password or other auth methods, create login/signup pages).
   - Define Database Schema (`schema.prisma`) (outline User model and other relevant entities with necessary fields).
   - Run Migrations (e.g., execute `wasp db migrate-dev`).

3. Phase 2: Backend Integrations
   - Setup External Services (e.g., API keys for Plaid, Stripe; install required libraries).
   - Create Service Modules (develop service files to handle API interactions and utility functions).
   - Declare Actions/Queries in `main.wasp` (import and register actions and queries).

4. Phase 3: Backend Logic (Data Queries)
   - Create Wasp Queries (implement data fetching, aggregation, and filtering for authenticated users).
   - Declare Queries in `main.wasp` linking to operations.

5. Phase 4: Frontend Development (React - Core App)
   - Setup Main Structure (build a main container component and define routing for core pages).
   - Implement Core Components (develop functional UI components for dashboards, lists, metrics, etc.)
   - Apply consistent Styling (using preferred CSS frameworks such as Tailwind CSS).

6. Phase 5: Payment/Subscription Integration (Optional)
   - Setup Payment Integration (configure payment service like Stripe, secure API keys, develop payment actions).
   - Implement Frontend Payment Integration (create pages for subscription management and payment processing).

7. Phase 6: Connecting & Refinement
   - Connect UI & Backend (ensure smooth integration between frontend components and backend logic).
   - Testing (thoroughly test authentication, data operations, and third-party integrations).
   - Deployment (follow Wasp deployment guidelines and configure production environment variables).

Replace placeholders (e.g., [APP NAME], [AppName]) with project-specific details. Use this template to generate a structured plan.md file for the app we've been discussing.
