# LIFEOS Admin Console

The admin console is an additional application area at `/admin`. The personal LIFEOS dashboard and trackers remain available at their original routes. Administrators can switch back using **Open LIFEOS**.

## Start and grant the first administrator

Run commands from `lifeos-testingphase` (the directory containing `package.json`). Node 22 or later is recommended; the existing dependencies must be installed and `.env` must define `DATABASE_URL`.

```powershell
npm run admin:setup -- "your-existing-account@example.com"
npm run dev
```

Open `http://localhost:8090/login` and sign in with that account's existing password. Admin accounts land on `/admin`; members land on `/`. No default administrator password or public promotion endpoint exists. The setup command accepts only an existing, active account with a password. Without an email argument, it installs the schema and default roles but promotes nobody.

For this workspace, the admin migrations and default roles have already been applied. No existing account was promoted because an email has not been specified. The prior database was backed up in `db/backups/pre-admin-*.db` (ignored by Git).

**Authentication upgrade:** the old `lifeos-user-id` cookie is no longer accepted. Existing users sign in once again. New sessions use random 256-bit tokens; only SHA-256 token hashes are stored in the database. Cookies are HttpOnly, SameSite=Lax, and Secure in production. Logout removes the session; suspension, account deletion, and password changes revoke sessions.

On Windows, stop running LIFEOS development servers before `prisma generate`, because an open server can lock the generated Prisma DLL. Restart afterward.

## Pages

| Route | Working features |
| --- | --- |
| `/admin` | Database KPIs, activity/growth chart, date filters, feature usage, learning totals, goal/action progress |
| `/admin/analytics` | Today/7/30/90/365-day and custom ranges; active contributors and registration chart; zoom for long ranges; accessible data table; billing summaries by currency |
| `/admin/users` | Search, role/status filters, sorting, paging, visible-column controls, selection/bulk status changes, create/edit users, staff role assignment, recoverable deletion |
| `/admin/users/[id]` | Profile, account timeline, usage counts, goals/actions, subscriptions/payments, feedback and support; sections filtered by permissions |
| `/admin/activity` | Searchable account-event timeline and recent tracker record activity, action/feature/date filters |
| `/admin/productivity` | Goals, overdue status, pending/completed improvement actions, real productivity totals |
| `/admin/learning` | Paginated/searchable learning sessions, completion states and recorded minutes |
| `/admin/reports` | Generate immutable user, productivity, usage, subscription and revenue snapshots; preview; CSV/XLSX/PDF downloads |
| `/admin/schedules` | Super Admin report schedules; daily, weekly or monthly cadence |
| `/admin/plans` | Pricing cards; create/edit/disable plans, currency, cycle, trial, features and descriptive limits |
| `/admin/subscriptions` | Create and update manual subscription records; dates, plans and lifecycle states |
| `/admin/payments` | Manual transaction ledger, unique references, user/subscription ownership validation, status/refund recording, detail view, date filters and CSV export |
| `/admin/content` | Draft/publish/archive/edit/delete plain-text resources; published resources appear in the member community page |
| `/admin/feedback`, `/admin/support` | Search/filter cases; priority, administrator assignment, internal notes/resolution and status management |
| `/admin/notifications` | Draft/schedule notifications; target a user, role, members or everyone; explicit send confirmation; in-app delivery count |
| `/admin/audit` | Read-only administrative events, account changes, exports and logins/logouts; search/date/action/entity filters |
| `/admin/settings` | Admin branding, local logo asset, new-account timezone, date preference, registration toggle, password minimum, session lifetime, in-app delivery toggle; configurable roles |
| `/admin/account` | Admin profile, personal settings link, password change and session revocation |
| `/community` | Authenticated member inbox/read receipts, published resources, feedback/support submission and case status |

## Components and design

`src/components/admin` contains `AdminShell`, `AdminWorkspace`, `Dashboard`, `GrowthChart`, `UsersPage`, `UserDetail`, `RecordsPage`, `RecordEditor`, role/report/account views, and reusable `Panel`, `Stat`, `AnimatedCounter`, `Badge`, `Pager`, `Confirm`, loading/error/empty states, search, date and export helpers.

The panel reuses Lucide, Radix dialogs/dropdowns, Recharts and the existing React/Next stack. It introduces no new runtime dependencies. Charts are dynamically loaded. Search is debounced and requests are cancelled when views change. Lists are paginated. CSS transitions, short number counters and Recharts animation respect reduced motion.

The forest-green sidebar, light and dark surface palettes, persistent sidebar collapse and light/dark/system preferences are isolated to the admin area. At tablet/mobile widths, a focus-trapped, Escape-dismissable navigation drawer replaces the sidebar. Tables scroll inside their panels. Layout checks cover 1440, 768, 390 and 320px.

## API and authorization

`src/app/api/admin/[...path]/route.ts` implements the API under `/api/admin`. Routes include `me`, `dashboard`, `analytics`, `users`, `users/[id]`, `users/bulk`, `activity`, `audit`, `productivity`, `learning`, `reports`, `reports/[id]`, `reports/[id]/download`, `settings`, `roles`, `roles/[id]`, `search`, lookup options, `security/password`, and each administrative resource listed above. Resource creation uses POST, editing PATCH and supported deletion DELETE. Notification delivery uses POST `/api/admin/notifications/[id]/send`.

The existing `/api/auth/login`, `/api/auth/register`, `/api/auth/me` and `/api/auth/logout` APIs retain their public response contract and now use revocable sessions. The existing tracker APIs share the upgraded authentication helper. `/api/community` enforces member ownership and published-only visibility.

Every admin API authenticates and checks permissions on the server. Super Admin is immutable; only Super Admin assigns staff roles or edits permission sets. Ordinary admins cannot edit staff accounts. Self-demotion/deletion and removal of the last active Super Admin are rejected transactionally. Permission changes take effect on the next API request. Admin mutation requests reject cross-origin browser requests and validate JSON with strict Zod schemas. Password hashes and tokens are never returned by user-management responses.

Default roles: **Super Admin, Admin, Manager, Support, Analyst**. A user with no role is a member. Permission keys are listed in `src/lib/admin/permissions.ts`. Reports and search also check permissions for their underlying data sources; permission to read reports alone does not grant access to user or billing exports.

Audit events are stored in the same transaction as administrative mutations. Deleting a user in the console removes access and revokes sessions while retaining historical records. It is recoverable account deletion, not irreversible personal-data erasure.

## Database

`prisma/migrations/202609070001_baseline` captures the pre-admin schema, including the existing Improvement feature. `202609070002_admin` preserves existing data while adding:

- User status, role reference and last-active timestamp.
- `AdminRole`, `AuthSession`, `AuthAttempt`, `AuditEvent`, `ActivityEvent`.
- `Plan`, `Subscription`, `Payment`.
- `ContentPost`, `Feedback`, `SupportTicket`.
- `Notification`, `NotificationReceipt`.
- `AdminReport`, `ReportSchedule`, `AdminSettings`.

`scripts/admin-setup.mjs` backs up an existing unmanaged SQLite database before baselining it. On an already migrated database it uses `prisma migrate deploy`. It does not overwrite edited default role permissions when run again. Do not use reset or `--accept-data-loss` to deploy this feature.

## Scheduled jobs

Set `ADMIN_JOBS_SECRET` to a random value of at least 32 characters and `LIFEOS_ORIGIN` to the application's origin in the server environment. Configure Windows Task Scheduler, cron or the hosting scheduler to run once per minute:

```powershell
npm run admin:jobs
```

The command authenticates to POST `/api/internal/admin-jobs`. It delivers due in-app notifications, saves scheduled reports, expires subscriptions and removes expired authentication records. Notification receipts are unique per recipient. Report schedules are claimed transactionally to avoid duplicate generation. Failed notification/report work remains eligible to retry. Nothing is emailed.

Scheduled reports cover the previous completed UTC day, seven days or 30 days, respectively. A monthly schedule advances by one calendar month; it is a rolling 30-day report rather than a calendar-month report. Worker throughput is bounded per run.

## Data definitions and current integration boundaries

- Dashboard numbers come from SQLite, never production fixtures. Activity means saved tracker records. The active-user counters combine tracker records with recorded account events, using UTC daily/7-day/30-day windows. They are not visit/session-duration analytics.
- The growth percentage compares new registrations with the previous equal-length period. When the previous count is zero, the UI shows new users instead of an invented percentage.
- Goal/action completion totals are all-time; learning/habit activity respects the selected reporting period. Daily score averages use saved `DailyEntry.dailyScore` values only. No artificial score is generated for missing days.
- Login history begins with this upgrade. Historical session duration, retention cohorts, conversion funnels and streak analytics are not collected by this release.
- Billing is a **manual administrative ledger**. It does not charge, refund, email invoices, enforce paid entitlements, or connect to Stripe/Razorpay. Personal ExpenseEntry data is never presented as application revenue. Currency totals are not combined without conversion.
- Payment-provider integration and webhooks, two-factor authentication, email verification, email/push transport, retention/conversion instrumentation and automatic paid-plan enforcement remain integration work.
- Support/feedback resolution notes are internal, while the member sees case status. Threaded comments and outbound support replies are not part of this release.
- Reports are limited to 10,000 user/subscription rows per snapshot and 100 preview rows. Narrow the date range for larger datasets. CSV cells are protected against formula injection; XLSX contains string/numeric cells without executable formulas. PDF uses an ASCII summary font (unsupported characters become `?`); use XLSX/CSV for full Unicode text.
- Settings branding is scoped to the admin console. Reporting dates remain UTC; the stored timezone is also used as the default for newly registered accounts. Existing member timezone settings are preserved.

## Validation

All QA accounts and illustrative chart data are isolated in `db/admin-test.db`, never in the user's working database. The test server uses port 8091 and `.next-admin-test`.

```powershell
# Initialize db/admin-test.db with the same migrations (see test setup below).
node tests/admin-fixtures.mjs
node tests/admin-server.mjs
# In another terminal:
node tests/admin-api.mjs
node tests/admin-security-extra.mjs
node tests/admin-browser.mjs
node tests/admin-accessibility.mjs
```

To initialize the isolated database on Windows, set `DATABASE_URL` to `file:` followed by the absolute path to `db/admin-test.db`, then run `node scripts/admin-setup.mjs` in that process. Do not change the working `.env` to run tests.

Verified during implementation:

- 105 API/security/regression assertions: role boundaries, session forgery, origin protection, validation, self/last-admin protections, suspension, ledger operations, published resources, feedback resolution, report formats, targeting/ownership, idempotent delivery and logout.
- Additional registration-policy, privilege-injection, runtime permission-update, scheduled-report/idempotency, login-throttling and expired-session checks, plus 13 existing personal APIs.
- Browser navigation across every admin page; real login/logout; sidebar persistence; Ctrl+K search; user creation/search; report generation; mobile drawer focus/Escape; theme persistence; reduced motion; personal dashboard/community regression; no browser console errors in the completed run.
- Automated axe-core WCAG A/AA overview checks in light and dark mode passed after contrast improvements. This is a scoped automated scan, not a claim of a complete accessibility certification.
- Every original row and column value was preserved across all 15 existing tables; SQLite foreign-key checks passed. Exported XLSX ZIP checksums and XML structure verified.
- Targeted lint: no errors (Next.js full-navigation recommendations remain on deliberate sign-out/password-change reloads).
- `node node_modules/next/dist/bin/next build` completed successfully, including compilation and all 47 static-page generation steps. Type validation is skipped by the application's existing Next configuration, so the separate typecheck limitation below still applies.
- Project-wide TypeScript checking still reports pre-existing errors in tracker pages, the auth store, weekly dashboard typing, MetricCard children and websocket examples. No errors were reported in the new admin modules at the checked revision. The existing Next configuration ignores build type errors; this is not a claim of a clean project-wide typecheck.

Generated screenshots and sample exports are in `tool-results/admin-qa/` (ignored by Git).
