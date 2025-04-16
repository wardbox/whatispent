Use the following instructions to generate a detailed, step-by-step `plan.md` file with Markdown checkboxes for building the app we've been discussing.

You are an AI tasked with creating a detailed implementation plan for building the app [APP NAME] using Wasp. Generate a `plan.md` file that outlines the development phases and specific tasks. **Crucially, format every individual task and sub-task as a standard Markdown checklist item (e.g., `- [ ] Task Description`)** to allow for easy progress tracking.

The plan should include the following sections, each broken down into specific, actionable checklist items:

1.  **Introduction**
    -   [ ] Provide a brief overview of [APP NAME] and key objectives.

2.  **Phase 1: Setup & Core Structure**
    -   [ ] Initialize Wasp Project (e.g., `wasp new [AppName]`).
    -   [ ] Configure basic project settings.
    -   [ ] Implement Authentication (setup auth methods).
    -   [ ] Create Login/Signup pages.
    -   [ ] Define Database Schema (`schema.prisma`) (User model).
    -   [ ] Define `<Entity 1>` schema.
    -   [ ] Define `<Entity 2>` schema (add more as needed).
    -   [ ] Run initial database migrations (`wasp db migrate-dev`).

3.  **Phase 2: Backend Integrations**
    -   [ ] Setup External Service 1 (e.g., Plaid): Obtain API keys.
    -   [ ] Install client library for Service 1.
    -   [ ] Create service module for Service 1 API interactions.
    -   [ ] Setup External Service 2 (e.g., Stripe): Obtain API keys.
    -   [ ] Install client library for Service 2.
    -   [ ] Create service module for Service 2 API interactions.
    -   [ ] Declare related Wasp Actions in `main.wasp`.
    -   [ ] Declare related Wasp Queries in `main.wasp`.

4.  **Phase 3: Backend Logic (Data Queries)**
    -   [ ] Create Wasp Query for <Data Feature 1>.
    -   [ ] Implement logic for fetching/aggregating data for <Data Feature 1>.
    -   [ ] Ensure query filters data based on authenticated user.
    -   [ ] Create Wasp Query for <Data Feature 2>.
    -   [ ] Implement logic for fetching/aggregating data for <Data Feature 2>.
    -   [ ] Declare new Queries in `main.wasp`.

5.  **Phase 4: Frontend Development (React - Core App)**
    -   [ ] Create main UI container component (e.g., DashboardPage).
    -   [ ] Define core routes in `main.wasp`.
    -   [ ] Implement Component for <UI Feature 1>.
    -   [ ] Implement Component for <UI Feature 2>.
    -   [ ] Manage state for interactive UI elements.
    -   [ ] Apply consistent styling (e.g., using Tailwind CSS).

6.  **Phase 5: Payment/Subscription Integration (Optional)**
    -   [ ] Configure payment provider (e.g., Stripe).
    -   [ ] Develop Action for creating checkout sessions.
    -   [ ] Develop Action for managing customer portal.
    -   [ ] Create frontend page/component for subscription management.
    -   [ ] Create frontend page/component for payment processing/redirects.

7.  **Phase 6: Connecting & Refinement**
    -   [ ] Integrate frontend hooks (`useQuery`, `useAction`) with backend logic.
    -   [ ] Implement loading and error states gracefully.
    -   [ ] Test Authentication flow.
    -   [ ] Test Core Feature 1.
    -   [ ] Test Core Feature 2.
    -   [ ] Test Payment flow (if applicable).
    -   [ ] Test External Service integrations.
    -   [ ] Prepare for deployment (check environment variables).
    -   [ ] Follow Wasp deployment guides.

Replace placeholders (e.g., `[APP NAME]`, `<Entity 1>`) with project-specific details. Ensure every task is a distinct checklist item (`- [ ]`). The goal is a practical, step-by-step checklist.
