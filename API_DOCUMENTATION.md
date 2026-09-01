# LIFEOS API Documentation

LIFEOS exposes a JSON HTTP API through Next.js route handlers.

## Base URL

Local development:

```text
http://localhost:8090/api
```

All request and response bodies are JSON unless noted otherwise. Send:

```http
Content-Type: application/json
```

## Authentication

Authentication uses the HTTP-only `lifeos-user-id` cookie. Registering or logging in sets this cookie for 30 days. Clients must retain and send the cookie on later requests.

Browser `fetch` calls on the same origin include it automatically. For cross-origin browser calls, use `credentials: "include"` and configure the deployment's CORS policy. In curl, use a cookie jar:

```bash
curl -c cookies.txt -X POST http://localhost:8090/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"secret123"}'

curl -b cookies.txt http://localhost:8090/api/auth/me
```

Except for `GET /api`, `POST /auth/register`, and `POST /auth/login`, all endpoints require authentication.

## Response conventions

Successful JSON responses generally use:

```json
{
  "success": true,
  "data": {}
}
```

Validation and other errors use:

```json
{
  "success": false,
  "error": "Validation failed",
  "details": ["Field-specific message"]
}
```

Common status codes are `200` (success), `201` (created), `400` (validation error), `401` (not authenticated or invalid credentials), `404` (resource not found), `409` (conflict), and `500` (server error).

Dates use `YYYY-MM-DD`; months use `YYYY-MM`. Numeric durations are in minutes, water is in millilitres, and food macros are in grams.

## Endpoint index

| Method | Path | Description |
|---|---|---|
| GET | `/api` | Health/demo response |
| POST | `/api/auth/register` | Create account and session |
| POST | `/api/auth/login` | Start session |
| POST | `/api/auth/logout` | End session |
| GET | `/api/auth/me` | Current user and settings |
| GET | `/api/dashboard/today` | Today's combined metrics |
| GET | `/api/dashboard/score` | Daily score |
| GET | `/api/dashboard/weekly` | Weekly dashboard |
| GET | `/api/dashboard/monthly` | Monthly dashboard |
| GET, POST | `/api/fitness` | List/create fitness entries |
| PUT, DELETE | `/api/fitness/:id` | Update/delete fitness entry |
| GET, POST | `/api/learning` | List/create learning sessions |
| PUT, DELETE | `/api/learning/:id` | Update/delete learning session |
| GET, POST | `/api/interview` | List/create interview sessions |
| PUT, DELETE | `/api/interview/:id` | Update/delete interview session |
| GET, POST | `/api/sleep` | List/create sleep entries |
| PUT, DELETE | `/api/sleep/:id` | Update/delete sleep entry |
| GET, POST | `/api/food` | List/create food entries |
| PUT, DELETE | `/api/food/:id` | Update/delete food entry |
| GET, POST | `/api/water` | List/create water entries |
| DELETE | `/api/water/:id` | Delete water entry |
| GET, POST | `/api/expenses` | List/create expenses |
| PUT, DELETE | `/api/expenses/:id` | Update/delete expense |
| GET | `/api/expenses/summary` | Expense aggregations |
| GET, POST | `/api/habits` | List/create habits |
| PUT, DELETE | `/api/habits/:id` | Update/delete habit |
| GET, POST | `/api/habits/complete` | Read/toggle completions |
| GET, POST | `/api/goals` | List/create goals |
| PUT, DELETE | `/api/goals/:id` | Update/delete goal |
| GET, POST | `/api/journal` | List/upsert journal entries |
| GET, PUT, DELETE | `/api/journal/:date` | Read/update/delete entry by date |
| GET, PUT | `/api/settings` | Read/update settings |
| GET | `/api/export` | Download user data |

## Authentication endpoints

### `POST /api/auth/register`

Body: `email` (required, valid email), `password` (required, minimum 6 characters), and optional `name`. Returns the new user and sets the session cookie. Duplicate email returns `409`.

### `POST /api/auth/login`

Body: `email` and `password`, both required. Returns the user and settings and sets the session cookie.

### `POST /api/auth/logout`

Deletes the session cookie.

### `GET /api/auth/me`

Returns `id`, `email`, `name`, and the user's goal/preference settings.

## Dashboard endpoints

### `GET /api/dashboard/today`

Returns today's fitness, learning, interview, sleep, water, food/protein, expense, habit, goal, and score data.

### `GET /api/dashboard/score`

Optional query: `date=YYYY-MM-DD`. Defaults to today. Returns a total score and weighted category breakdown.

### `GET /api/dashboard/weekly`

Returns the current week's daily and aggregate dashboard data.

### `GET /api/dashboard/monthly`

Optional query: `month=YYYY-MM`. Defaults to the current month.

## Tracking resources

List endpoints support the filters shown below. A supplied `date` takes precedence over a range. `limit` is an optional integer.

| Resource | GET filters | Create fields |
|---|---|---|
| Fitness | `date`, `startDate`, `endDate`, `limit` | `date?`, `workoutDuration?`, `workoutType?`, `pushups?`, `squats?`, `pullups?`, `otherExercises?`, `caloriesBurned?`, `completed?`, `notes?` |
| Learning | `date`, `startDate`, `endDate`, `category`, `limit` | `date?`, `topic`*, `category?`, `startTime?`, `endTime?`, `duration?`, `whatLearned?`, `notes?`, `completed?` |
| Interview | `date`, `startDate`, `endDate`, `category`, `limit` | `date?`, `topic`*, `category?`, `startTime?`, `endTime?`, `duration?`, `questionsPracticed?`, `questionsAnswered?`, `correctAnswers?`, `incorrectAnswers?`, `mockInterview?`, `codingPractice?`, `notes?`, `confidenceLevel?`, `difficulty?` |
| Sleep | `date`, `startDate`, `endDate`, `limit` | `date?`, `sleepStart`*, `sleepEnd`*, `quality?`, `notes?` |
| Food | `date`, `startDate`, `endDate`, `mealType`, `limit` | `date?`, `mealType`*, `foodName`*, `quantity?`, `calories?`, `protein?`, `carbohydrates?`, `fat?`, `notes?` |
| Water | `date`, `startDate`, `endDate` | `date?`, `amount`*, `notes?` |
| Expenses | `date`, `startDate`, `endDate`, `category`, `paymentMethod`, `limit` | `date?`, `amount`*, `category`*, `reason?`, `paymentMethod?`, `notes?` |

`*` means required. If `date` is omitted on creation, the current date in the app timezone is used. Numeric activity, nutrition, water, and expense values must be non-negative.

Create operations use `POST /api/{resource}` and return `201`. Update operations use `PUT /api/{resource}/{id}` with any mutable fields and return `200`. Delete operations use `DELETE /api/{resource}/{id}`. Water currently supports deletion but not update. There are no GET-by-ID handlers for these resources.

Example:

```bash
curl -b cookies.txt -X POST http://localhost:8090/api/fitness \
  -H "Content-Type: application/json" \
  -d '{"date":"2026-09-01","workoutType":"strength","workoutDuration":60,"pushups":40,"completed":true}'
```

Most list responses contain the records plus resource-specific totals/statistics, rather than a bare array.

## Expenses summary

### `GET /api/expenses/summary`

Query parameters:

- `type`: `daily`, `weekly`, `monthly`, or `category`; omit it to receive all summaries.
- `date`: anchor date for daily/weekly summaries; defaults to today.
- `month`: `YYYY-MM` for monthly/category summaries; defaults to the current month.

## Habits

### `GET /api/habits`

Queries: `includeInactive=true|false` and optional `date=YYYY-MM-DD` to attach completion status.

### `POST /api/habits`

Body: required `name`; optional `description`, `icon`, `color`, and `isActive`.

### `PUT /api/habits/:id`

Partial body: `name`, `description`, `icon`, `color`, `isActive`.

### `DELETE /api/habits/:id`

Deletes the habit and its associated completion records.

### `POST /api/habits/complete`

Body: required `habitId`; optional `date` (defaults to today) and `completed`. If `completed` is omitted, the state is toggled.

```json
{
  "habitId": "habit-id",
  "date": "2026-09-01",
  "completed": true
}
```

### `GET /api/habits/complete`

Requires `startDate` and `endDate`. Optional `habitId` adds streak information.

## Goals

### `GET /api/goals`

Queries: `type`, `category`, `includeCompleted=false`, and `activeOnly=true`. Response includes goals and completion statistics.

### `POST /api/goals`

Body fields: `title`*, `type`*, `category`*, `startDate`*, `description?`, `targetValue?`, `unit?`, `endDate?`, `isCompleted?`.

### `PUT /api/goals/:id`

Accepts partial create fields plus `isCompleted`.

### `DELETE /api/goals/:id`

Deletes a goal owned by the current user.

## Journal

### `GET /api/journal`

Queries: `startDate`, `endDate`, and `limit`. Returns entries and basic statistics.

### `POST /api/journal`

Upserts the entry for `date` (defaults to today). Fields: `accomplishments`, `whatLearned`, `wentWell`, `wentWrong`, `improvementTomorrow`, and `generalNotes`.

### `/api/journal/:date`

- `GET` returns the entry for a `YYYY-MM-DD` date.
- `PUT` partially updates or creates that date's entry using the journal fields above.
- `DELETE` deletes the entry.

## Settings

### `GET /api/settings`

Returns profile fields, goals, currency, and timezone.

### `PUT /api/settings`

Accepts at least one of: `name`, `workoutGoal`, `pushupGoal`, `learningGoal`, `interviewGoal`, `sleepGoal`, `waterGoal`, `proteinGoal`, `currency`, or `timezone`. Goal values must be non-negative integers.

Supported timezones are `Asia/Kolkata`, `America/New_York`, `America/Los_Angeles`, `Europe/London`, `Asia/Tokyo`, `Asia/Shanghai`, `Australia/Sydney`, and `UTC`.

## Export

### `GET /api/export`

`format=json` downloads a JSON attachment. Optional `include` is a comma-separated subset of `profile`, `fitness`, `learning`, `interview`, `sleep`, `food`, `water`, `expenses`, `habits`, `goals`, `journal`, `dailyEntries`, and `reminders`.

```bash
curl -b cookies.txt -OJ "http://localhost:8090/api/export?format=json&include=fitness,learning,goals"
```

Only JSON download formatting is currently implemented. An unrecognised `format` returns the export inside the normal JSON response envelope.

## Allowed enum values

- `workoutType`: `cardio`, `strength`, `hiit`, `yoga`, `sports`, `other`
- Learning `category`: `api-testing`, `python`, `ai-testing`, `sql`, `automation`, `other`
- Interview `category`: `manual-testing`, `automation`, `api-testing`, `sql`, `java`, `python`, `ai-testing`, `llm-testing`, `rag-testing`, `selenium`, `testng`, `postman`, `performance`, `security`, `hr`, `behavioral`, `coding`, `aptitude`, `other`
- `mealType`: `breakfast`, `lunch`, `dinner`, `snack`, `pre-workout`, `post-workout`
- Expense `category`: `food`, `travel`, `shopping`, `gym`, `education`, `entertainment`, `bills`, `health`, `other`
- `paymentMethod`: `cash`, `upi`, `card`, `bank-transfer`, `other`
- Sleep `quality`: `excellent`, `good`, `fair`, `poor`
- Goal `type`: `daily`, `weekly`, `monthly`
- Goal `category`: `fitness`, `learning`, `interview`, `sleep`, `water`, `protein`, `expense`, `other`

## JavaScript example

```js
const login = await fetch("http://localhost:8090/api/auth/login", {
  method: "POST",
  credentials: "include",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    email: "user@example.com",
    password: "secret123"
  })
});

if (!login.ok) throw new Error(await login.text());

const dashboard = await fetch("http://localhost:8090/api/dashboard/today", {
  credentials: "include"
});

console.log(await dashboard.json());
```

## Current implementation notes

- Authentication is a direct user-ID cookie, not a bearer token or signed session token. Use HTTPS and strengthen session handling before exposing the API publicly.
- No rate limiting or API version prefix is currently implemented.
- The client wrapper has a `fitnessApi.getById()` method, but the server has no `GET /api/fitness/:id` handler.
- The default `GET /api` response is `{ "message": "Hello, world!" }` and can be used as a basic availability check.
