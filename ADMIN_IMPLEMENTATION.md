# LIFEOS administration

## Implementation plan

Extend the Next.js App Router application and existing Prisma/SQLite database. Keep personal dashboards and tracker routes intact. Reuse Lucide icons, Radix dialogs, Recharts, Tailwind, and CSS transitions.

1. Capture the current schema as a migration baseline; add sessions, roles, audit/activity events, billing records, reports, notifications, content, feedback, support, and application settings.
2. Replace the forgeable user-ID authentication cookie with hashed, revocable sessions. Check account status on every authenticated request. Add backend permission checks, strict validation, same-origin mutation checks, immutable audit events, and safeguards for Super Admin accounts.
3. Add an isolated `/admin` layout and responsive light/dark/system visual system. Add dashboard, analytics, users and details, activity, productivity, learning, reports, plans, subscriptions, payments, content, feedback, support, notifications, audit logs, and settings/roles.
4. Connect metrics to database aggregates. Keep historical absence distinct from zero and personal expenses distinct from application revenue. Billing is a manual administrative ledger until a payment provider is connected.
5. Add report exports and an explicit scheduled-job command, an in-app notification inbox, and published resources/feedback/support access for members.
6. Verify backend authorization and mutations against a separate test database, run frontend desktop/mobile/dark/reduced-motion checks, and document deployment and known limitations.

## File boundaries

New: `src/lib/admin/*`, `src/components/admin/*`, `src/app/admin/*`, `src/app/api/admin/*`, member inbox/resource APIs, `scripts/*`, migrations, and admin tests.

Modified: Prisma schema; shared authentication and auth routes; auth provider to select the admin layout; login redirect and user role metadata; existing navigation to expose permitted admin access and the member inbox.

Existing personal tracking data and pages remain in place. Old user-ID cookies deliberately expire during the security upgrade; members sign in once again.
