import { Prisma } from '@prisma/client';
import { db } from '@/lib/db';

// Identifiers come exclusively from this fixed list, never from request input.
const sources = [
  ['FitnessEntry', 'Fitness'], ['LearningSession', 'Learning'], ['InterviewSession', 'Interview'],
  ['SleepEntry', 'Sleep'], ['FoodEntry', 'Nutrition'], ['WaterEntry', 'Hydration'],
  ['HabitCompletion', 'Habits'], ['Goal', 'Goals'], ['Improvement', 'Improvements'],
  ['JournalEntry', 'Journal'], ['ExpenseEntry', 'Expenses'],
] as const;
const activityUnion = Prisma.join(sources.map(([table, feature]) => Prisma.sql`SELECT "userId", "createdAt", ${feature} AS feature FROM ${Prisma.raw(`"${table}"`)}`), ' UNION ALL ');

export async function analytics(start: Date, end: Date, billing = false) {
  const previousStart = new Date(+start - (+end - +start + 1));
  const today = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate()));
  const [totalUsers, newUsers, previousUsers, active, series, features, registrations, goalStats, improvementStats, learning, habitCount, logins, revenue, subscriptions, scores] = await Promise.all([
    db.user.count({ where: { status: { not: 'deleted' } } }),
    db.user.count({ where: { createdAt: { gte: start, lte: end } } }),
    db.user.count({ where: { createdAt: { gte: previousStart, lt: start } } }),
    db.$queryRaw<Array<{ days: string; count: bigint }>>(Prisma.sql`
      SELECT 'daily' AS days, COUNT(DISTINCT "userId") AS count FROM (${activityUnion} UNION ALL SELECT "userId", "createdAt", 'Account' FROM "ActivityEvent") WHERE "createdAt" >= ${today} AND "createdAt" <= ${new Date()}
      UNION ALL SELECT 'weekly', COUNT(DISTINCT "userId") FROM (${activityUnion} UNION ALL SELECT "userId", "createdAt", 'Account' FROM "ActivityEvent") WHERE "createdAt" >= ${new Date(+today - 6 * 86400000)} AND "createdAt" <= ${new Date()}
      UNION ALL SELECT 'monthly', COUNT(DISTINCT "userId") FROM (${activityUnion} UNION ALL SELECT "userId", "createdAt", 'Account' FROM "ActivityEvent") WHERE "createdAt" >= ${new Date(+today - 29 * 86400000)} AND "createdAt" <= ${new Date()}`),
    db.$queryRaw<Array<{ date: string; activities: bigint; active: bigint }>>(Prisma.sql`SELECT strftime('%Y-%m-%d', "createdAt" / 1000, 'unixepoch') AS date, COUNT(*) AS activities, COUNT(DISTINCT "userId") AS active FROM (${activityUnion}) WHERE "createdAt" >= ${start} AND "createdAt" <= ${end} GROUP BY date ORDER BY date`),
    db.$queryRaw<Array<{ name: string; count: bigint }>>(Prisma.sql`SELECT feature AS name, COUNT(*) AS count FROM (${activityUnion}) WHERE "createdAt" >= ${start} AND "createdAt" <= ${end} GROUP BY feature ORDER BY count DESC`),
    db.$queryRaw<Array<{ date: string; count: bigint }>>(Prisma.sql`SELECT strftime('%Y-%m-%d', "createdAt" / 1000, 'unixepoch') AS date, COUNT(*) AS count FROM "User" WHERE "createdAt" >= ${start} AND "createdAt" <= ${end} GROUP BY date`),
    db.goal.groupBy({ by: ['isCompleted'], _count: true }),
    db.improvement.groupBy({ by: ['completed'], where: { kind: 'action' }, _count: true }),
    db.learningSession.aggregate({ where: { createdAt: { gte: start, lte: end } }, _count: true, _sum: { duration: true } }),
    db.habitCompletion.count({ where: { completed: true, createdAt: { gte: start, lte: end } } }),
    db.activityEvent.count({ where: { action: 'login', createdAt: { gte: start, lte: end } } }),
    billing ? db.payment.groupBy({ by: ['currency', 'status'], where: { paidAt: { gte: start, lte: end } }, _sum: { amountCents: true }, _count: true }) : Promise.resolve([]),
    billing ? db.subscription.groupBy({ by: ['status'], _count: true }) : Promise.resolve([]),
    db.dailyEntry.aggregate({ where: { date: { gte: start.toISOString().slice(0, 10), lte: end.toISOString().slice(0, 10) }, dailyScore: { not: null } }, _avg: { dailyScore: true }, _count: { dailyScore: true } }),
  ]);
  const graph: { date: string; activities: number; active: number; registrations: number }[] = [];
  for (let t = +start; t <= +end; t += 86400000) {
    const date = new Date(t).toISOString().slice(0, 10);
    const row = series.find(r => r.date === date);
    graph.push({ date, activities: Number(row?.activities || 0), active: Number(row?.active || 0), registrations: Number(registrations.find(r => r.date === date)?.count || 0) });
  }
  const completed = goalStats.filter(r => r.isCompleted).reduce((a, r) => a + r._count, 0) + improvementStats.filter(r => r.completed).reduce((a, r) => a + r._count, 0);
  const pending = goalStats.filter(r => !r.isCompleted).reduce((a, r) => a + r._count, 0) + improvementStats.filter(r => !r.completed).reduce((a, r) => a + r._count, 0);
  return {
    totalUsers, newUsers, previousUsers, growth: previousUsers ? Math.round((newUsers - previousUsers) / previousUsers * 100) : null,
    active: Object.fromEntries(active.map(r => [r.days, Number(r.count)])), graph,
    features: features.map(r => ({ name: r.name, count: Number(r.count) })),
    activityCount: graph.reduce((sum, r) => sum + r.activities, 0),
    productivity: { completed, pending, completion: completed + pending ? Math.round(completed / (completed + pending) * 100) : 0, habits: habitCount, learningMinutes: learning._sum.duration || 0, learningSessions: learning._count },
    logins, dailyScore: scores._avg.dailyScore, scoredDays: scores._count.dailyScore,
    revenue: revenue.map(r => ({ currency: r.currency, status: r.status, cents: r._sum.amountCents || 0, count: r._count })),
    subscriptions: subscriptions.map(r => ({ status: r.status, count: r._count })),
    start: start.toISOString(), end: end.toISOString(),
    definitions: 'UTC reporting dates. Activity counts saved tracker records; active users are distinct accounts with tracker records or recorded account events. Login history begins with the admin upgrade. Productivity totals cover all goals and improvement actions. Daily score uses only saved scores.',
  };
}

export async function trackerActivity(start: Date, end: Date, userId?: string) {
  return db.$queryRaw<Array<{ id: string; userId: string; feature: string; createdAt: Date; name: string | null; email: string }>>(Prisma.sql`
    SELECT a.*, u.name, u.email FROM (${Prisma.join(sources.map(([table, feature]) => Prisma.sql`SELECT id, "userId", "createdAt", ${feature} AS feature FROM ${Prisma.raw(`"${table}"`)}`), ' UNION ALL ')}) a
    JOIN "User" u ON u.id = a."userId" WHERE a."createdAt" >= ${start} AND a."createdAt" <= ${end} ${userId ? Prisma.sql`AND a."userId" = ${userId}` : Prisma.empty}
    ORDER BY a."createdAt" DESC LIMIT 100`);
}
