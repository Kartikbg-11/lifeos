# LIFEOS Admin · Java Selenium automation

An executable end-to-end test project for the existing LIFEOS admin panel. UI workflows use **Selenium WebDriver**. Java's HTTP client creates independent test records and verifies persisted results and server-side authorization. No browser network mocking is used.

## Requirements

- JDK **21 or newer** and Maven **3.9+** on `PATH`.
- Node **22+**, npm, and the application's dependencies (`npm ci`).
- Chrome, Firefox, or Edge. Selenium Manager resolves matching drivers; initial execution requires internet access. Chrome is the default.

The project pins Selenium 4.48.0, TestNG 7.12.0, Maven Surefire 3.6.0, and Java release 21. No commercial reporting service or credentials are required.

## Run the complete build and suite

From the application directory containing `package.json`:

```powershell
npm run test:admin:selenium
```

This command:

1. Creates a unique SQLite database under `automation/admin-selenium/.runtime/`.
2. Applies the actual Prisma migrations and creates generated QA accounts for all six roles, plus a disposable password-rotation account.
3. Builds the Next.js application into `.next-admin-test` and starts its production server at **http://localhost:8190**, bound to IPv4 loopback. The `localhost` origin matches Next.js loopback URL normalization; explicit IPv4 binding avoids Java/Node address-resolution differences on Windows.
4. Runs `mvn clean verify` with two parallel test classes and a new WebDriver session for every test invocation.
5. Writes HTML, JSON, TestNG/Surefire XML, failure screenshots, and supported browser console logs.
6. Stops the server it started, even when a test fails. A failed, skipped, empty, or misconfigured run returns a nonzero exit code.

The working app on port 8090 and its admin credentials are not used. The framework never resets that database. Generated credentials remain in the ignored run directory and are not printed or committed. The test suite checks the sandbox identity before it performs mutations.

## Useful commands

```powershell
# Quick smoke suite (still builds the app and Java project)
npm run test:admin:selenium -- --groups=smoke

# Full cross-browser runs
npm run test:admin:selenium -- --browser=firefox
npm run test:admin:selenium -- --browser=edge

# See the browser while debugging
npm run test:admin:selenium -- --headed --threads=1 --test=UsersTest

# Faster local iterations using the dev server
npm run test:admin:selenium -- --dev --test=ContentAndMessagingTest

# Reuse a previously successful, unchanged application build
npm run test:admin:selenium -- --skip-app-build --test=AuthorizationApiTest

# Compile the Java framework without executing tests
mvn -B -ntp -f automation/admin-selenium/pom.xml -DskipTests package
```

`--skip-app-build` must only be used while the application source matches the last successful production build. A fresh test database is created even in this mode. CI always builds from source.

Supported options: `--browser=chrome|firefox|edge`, `--groups=smoke,regression,security`, `--threads=1..8`, `--test=ClassName` (or Maven test patterns), `--headed`, `--dev`, `--serve-only`, `--skip-app-build`. Use `E2E_PORT` to choose a free test port other than 8090/8091.

## Reports

Open **`target/reports/index.html`** inside this module after a run.

| Artifact | Purpose |
| --- | --- |
| `target/reports/index.html` | Per-test result, duration, failure details, screenshot links |
| `target/reports/summary.json` | Machine-readable totals, browser, and run ID |
| `target/reports/artifacts/*.png` | Screenshots captured before a failed browser is closed |
| `target/reports/artifacts/*-browser.log` | Browser console logs when the driver supports retrieval |
| `target/surefire-reports/` | TestNG and Maven XML/text reports, including configuration errors |
| `target/downloads/` | Actual CSV, XLSX, and PDF browser downloads from report tests |
| `.runtime/<run>/application.log` | Build/server log, retained if failure occurs before Java starts |

There are no blanket retries, swallowed assertions, or success results for skipped tests. Fix failures and rerun the affected class, then run the full suite again. `clean verify` replaces the previous `target` output; preserve a report elsewhere if you need historical evidence.

## Coverage

| Area | Workflows and assertions |
| --- | --- |
| Authentication | UI sign-in/sign-out, wrong password, anonymous redirects, member exclusion, password rotation and session revocation |
| Navigation/dashboard | All 18 admin routes, real database metrics, date filters, accessible chart data, keyboard search, persistent theme/sidebar |
| Mobile/readability | Verified 768/390/320 CSS viewport widths, overflow checks, readable navigation text, focus restoration after closing the drawer |
| Users | Create/edit/persistence, search, empty state, role filter, columns, pagination, suspend/activate, recoverable deletion, role assignment |
| Content | Draft/publish/archive/delete; published-only member visibility |
| Notifications | UI delivery to one member, recipient isolation, read receipts, idempotent delivery |
| Support/feedback | Member submission, admin assignment/resolution, internal-note privacy |
| Billing | Plan creation/disabling, subscription and manual payment creation, refund status, settled-amount immutability |
| Reports | UI generation, preview, browser CSV/XLSX/PDF downloads, file content/structure |
| Roles/settings | Custom role creation and permission updates enforced on an existing session |
| API security | Every admin resource: anonymous/member denial and Super Admin access; restricted staff roles, forged cookies, cross-origin writes, self-deletion/role guards, query validation, no password-hash disclosure |
| Jobs | Secret authentication, due scheduled reports, duplicate-notification prevention |

The app's manual ledger does not charge/refund money. Email, push delivery, two-factor authentication, external billing providers, load testing, and a comprehensive accessibility audit are outside these tests. Passing this suite establishes the listed scenarios on the recorded revision/browser; it is not a claim that every possible application behavior is correct.

## Architecture and extension

```text
scripts/                       Isolated database, production build, server lifecycle
src/test/java/com/lifeos/automation/
  core/                        Configuration, API client, thread-local drivers, lifecycle, reports
  pages/                       Login, admin shell, users, records, reports page objects
  tests/                       Independent UI and API scenario classes
target/                        Generated reports, downloads, compiled tests (ignored)
.runtime/                      Disposable databases/configuration/logs (ignored)
```

Tests are independent and run by **class** in parallel; data-provider rows execute sequentially within their class. WebDriver instances are thread-local and protected by Selenium ThreadGuard. Increasing `--threads` scales across classes. Avoid enabling method-level parallelism until any new shared class state has been removed.

Responsive checks use Chromium device-metrics emulation through Selenium's CDP interface when available, because desktop Chromium clamps narrow windows. Other drivers use window sizing with a browser-chrome adjustment. Every case asserts the actual CSS viewport width; an unsupported narrow size fails instead of silently testing a wider screen. These checks exercise responsive desktop rendering, not touch input or a physical mobile browser.

To add a workflow: put selectors/actions in a page object, extend `BaseUiTest`, give the method a `smoke`, `regression`, or `security` group, create uniquely named records, and assert both visible behavior and persisted results. Use labels, accessible names, IDs, or stable structural selectors. Wait for conditions with `WebDriverWait`; do not use fixed sleeps, JavaScript clicks, or automatic retry loops around failed actions.

## IDE and Selenium Grid

```powershell
# Terminal 1: provision and keep a sandbox running
npm run test:admin:selenium -- --serve-only

# Terminal 2 / IDE environment: use the configuration path printed by the runner
$env:E2E_CONFIG = 'C:\path\to\automation\admin-selenium\.runtime\RUN\config.properties'
mvn -f automation/admin-selenium/pom.xml test '-Dtest=UsersTest' '-Dbrowser=chrome'
```

For Grid, set `SELENIUM_GRID_URL` to the Grid URL (or `-Dgrid.url=...` in direct Maven runs). The managed runner binds to loopback. For a remote Grid, separately start the provisioned sandbox on a reachable hostname and set its configuration's `base.url` to that same origin, reachable **both** by Java and the Grid browser; loopback inside a remote container is not the host application. Grid downloads require managed downloads (`se:downloadsEnabled`, set by the framework). Chrome, Firefox, Edge and RemoteWebDriver paths are configurable; see `VALIDATION.md` for the combinations actually executed.

Only one managed runner may use a checkout at a time because `.next-admin-test` is shared. Use separate checkouts/CI jobs for independent parallel suites. Runtime directories are deliberately retained for debugging; remove old, stopped runs manually when no longer needed.

## GitHub Actions

`.github/workflows/admin-selenium.yml` builds and runs Chrome and Firefox in separate jobs for relevant pushes to `feature/automation-1.0`, `lifeoswith-admin`, and `main`, and for pull requests. Manual dispatch selects Chrome, Firefox, or Edge once the workflow is available on the repository's default branch. It uses Node 22 and Java 21 and uploads reports on failure or success with seven-day retention. All accounts/data are generated within the runner; no production secrets are required.

The pipeline installs locked dependencies, builds the production application, runs the isolated Selenium suite, and publishes test-report artifacts. A failed build or test fails the job. Application deployment is not configured; a deployment environment and release policy must be selected before adding a delivery job.

References: [Selenium page objects](https://www.selenium.dev/documentation/test_practices/encouraged/page_object_models/), [Selenium Manager](https://www.selenium.dev/documentation/selenium_manager/), [ThreadGuard](https://www.selenium.dev/documentation/webdriver/support_features/thread_guard/), [TestNG execution and listeners](https://testng.org/documentation.html).
