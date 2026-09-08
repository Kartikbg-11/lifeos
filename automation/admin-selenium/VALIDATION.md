# Validation record

Validation date: 2026-09-08. Checkout: `lifeoswith-admin`, based on `dca7439d`, with the local automation framework and drawer-focus fix.

## Environment

| Component | Executed version |
| --- | --- |
| OS | Windows 11, amd64 |
| Node | 26.5.0 |
| Java runtime | Temurin 25.0.3; Java source compiled with release 21 |
| Maven | 3.9.6 |
| Selenium / TestNG / Surefire | 4.48.0 / 7.12.0 / 3.6.0 |
| Browser | Local headless Chrome 152.0.7977.76 |
| ChromeDriver | 152.0.7977.82, resolved by Selenium Manager |
| Application | Next.js 16.3.1, production standalone build |
| Data | Fresh SQLite database and generated accounts for each managed run |

## Results

**Final complete run: 83/83 passed, zero failures, errors, skips, or configuration failures.**

- Run ID: `selenium-1788849582714-6f63ff`.
- Finished: 2026-09-08 12:17:14 IST.
- Maven elapsed time: 7 minutes 14 seconds.
- Command: `npm run test:admin:selenium -- --skip-app-build`.
- Parallel execution: two test classes, with a fresh browser per UI invocation.

| Test class | Passed / total |
| --- | --- |
| AuthenticationTest | 5 / 5 |
| AuthorizationApiTest | 38 / 38 |
| BillingTest | 2 / 2 |
| ContentAndMessagingTest | 4 / 4 |
| NavigationTest | 24 / 24 |
| ReportsAndSettingsTest | 2 / 2 |
| ScheduledJobsTest | 3 / 3 |
| UsersTest | 5 / 5 |

The application was rebuilt after the drawer-focus fix. Subsequent runs use `--skip-app-build` against that unchanged application build and still create fresh databases and compile the Java sources.

Targeted validation confirmed:

- Billing: 2/2 passed.
- Content and messaging: 4/4 passed.
- Responsive navigation: 3/3 passed, with actual CSS widths asserted at 768, 390, and 320 pixels.
- User management after the dropdown fix: 5/5 passed.
- Lint of `src/components/admin/admin-shell.tsx`: zero errors; one existing warning about logout's `window.location.assign()`.
- JavaScript runner syntax and Git whitespace checks passed. All 19 Java source files are eligible for tracking; runtime credentials and generated output remain ignored.

## Fixes verified by these runs

- Included `src/test` despite the repository's broad `test` ignore rule.
- Matched Selenium 4.48's downloaded-file metadata API.
- Used HTTP/1.1 for Java requests to the local application server.
- Bound the server to IPv4 while keeping the `localhost` origin expected by Next.js loopback normalization.
- Waited for debounced search results to replace the previous table before acting on rows.
- Located user detail links as anchors.
- Supported select options whose HTML value is implicit in their text.
- Restored keyboard focus to the mobile menu button when the admin drawer closes.
- Used Chromium viewport emulation to avoid silently testing 500 pixels when 390 or 320 was requested.

## Limits

Firefox, Edge, Selenium Grid, headed mode, and GitHub Actions have not been executed in this local validation. CI is configured for Chrome and Firefox, with Edge available on manual dispatch. Node 22 and Java 21 are configured for CI but were not the local runtime versions.

Responsive tests exercise CSS layout and keyboard behavior in a desktop browser, not physical mobile devices or touch input. The existing Next.js build configuration skips TypeScript type checking; a successful application build is not evidence of a clean full-project type check.

Only the listed scenarios are covered. External email/push delivery, real payment providers, comprehensive accessibility auditing, and load testing are outside this suite.

## Reproduce

```powershell
npm run test:admin:selenium
```

The final HTML report is `target/reports/index.html`; totals are in `target/reports/summary.json`, with per-class XML in `target/surefire-reports/`. Each `clean verify` replaces `target`; earlier local debugging reports are retained inside their ignored `.runtime/<run>/reports` directories when explicitly preserved.
