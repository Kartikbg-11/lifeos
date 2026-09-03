# LIFEOS

LIFEOS is a full-stack personal growth and daily tracking application. It combines fitness, learning, interview preparation, sleep, nutrition, hydration, expenses, habits, goals, journaling, analytics, and user settings in one dashboard.

## Tech stack

- Next.js 16 with the App Router
- React 19 and TypeScript
- Tailwind CSS and shadcn/ui components
- Prisma ORM
- SQLite database
- Zustand for client state
- Recharts for analytics
- Cookie-based authentication with bcrypt password hashing

## Features

- Email/password registration and sign-in
- Daily dashboard and score tracking
- Fitness and exercise logging
- Learning and interview-preparation sessions
- Sleep, food, protein, and water tracking
- Expense tracking and summaries
- Habit and goal management
- Daily journal
- Weekly and monthly analytics
- User preferences and data export

## Requirements

- Node.js 20.9 or newer
- npm

## Local setup

1. Extract the project and open a terminal in its root directory.

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create the local environment file.

   On Windows PowerShell:

   ```powershell
   Copy-Item .env.example .env
   ```

   On macOS or Linux:

   ```bash
   cp .env.example .env
   ```

   The default configuration is:

   ```env
   DATABASE_URL=file:./db/custom.db
   ```

4. Start the development server:

   ```bash
   npm run dev
   ```

   The `predev` script automatically generates the Prisma client and synchronizes the SQLite database schema.

5. Open [http://localhost:8090](http://localhost:8090).

6. Select **Create one free** on the login page to create the first account. Local database files are intentionally not included in the source archive.

## Existing local test account

If you are running the original development database rather than a fresh source archive, this test account may be available:

- Email: `lifeos@example.com`
- Password: `LifeOS@8090`

Do not use these credentials in production.

## Available scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Initialize the database and start Next.js on port 8090 |
| `npm run build` | Create a production build |
| `npm run lint` | Run ESLint |
| `npm run db:generate` | Generate the Prisma client |
| `npm run db:push` | Synchronize the database with the Prisma schema |
| `npm run db:migrate` | Create and apply a development migration |
| `npm run db:reset` | Reset the local database (deletes its data) |

## Project structure

```text
lifeos-testingphase/
├── prisma/
│   └── schema.prisma       # Database models
├── public/                 # Static assets
├── src/
│   ├── app/                # Pages and API route handlers
│   ├── components/         # UI and layout components
│   ├── lib/                # Database, authentication, and utilities
│   ├── services/           # Browser-side API client
│   └── store/              # Zustand stores
├── tests/                  # Test files
├── .env.example            # Environment variable template
├── API_DOCUMENTATION.md    # REST API reference
├── package.json            # Dependencies and scripts
└── next.config.ts          # Next.js configuration
```

## API

API routes are served under `/api`. Authentication endpoints include:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/logout`

See [API_DOCUMENTATION.md](API_DOCUMENTATION.md) and [LIFEOS.postman_collection.json](LIFEOS.postman_collection.json) for the complete API reference and Postman collection.

## Database

The application uses SQLite for local development. Prisma resolves the configured database path relative to `prisma/schema.prisma`. Generated `.db` files contain local user data and should not be committed or shared.

To apply schema changes:

```bash
npm run db:push
```

## Security notes

- Keep `.env` private; commit only `.env.example`.
- Replace shared test credentials before deployment.
- Use HTTPS in production so authentication cookies are transmitted securely.
- Back up the SQLite database before migrations or resets.

## Troubleshooting

### Port 8090 is already in use

Stop the process using port 8090, or temporarily run Next.js on another port:

```bash
npx next dev -p 8091
```

### Prisma client or database errors

Run:

```bash
npm run db:generate
npm run db:push
```

Then restart the development server.

### Login does not work after copying the source

A fresh archive does not contain the original SQLite user database. Open `/register` and create a new account before signing in.

