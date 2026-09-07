import { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import { analytics } from './analytics';
import type { Permission } from './permissions';
import { AdminError } from './server';

export const reportPermissions: Record<string, Permission> = { users: 'users.read', productivity: 'productivity.read', usage: 'analytics.read', subscriptions: 'billing.read', revenue: 'billing.read' };
export type ReportRows = { columns: string[]; rows: (string | number | null)[][] };

export async function reportSnapshot(type: string, start: Date, end: Date): Promise<ReportRows> {
  if (type === 'users') {
    const rows = await db.user.findMany({ where: { createdAt: { gte: start, lte: end } }, select: { name: true, email: true, status: true, createdAt: true, role: { select: { name: true } } }, orderBy: { createdAt: 'desc' }, take: 10000 });
    return { columns: ['Name', 'Email', 'Role', 'Status', 'Registered (UTC)'], rows: rows.map(r => [r.name, r.email, r.role?.name || 'Member', r.status, r.createdAt.toISOString()]) };
  }
  if (type === 'revenue') {
    const rows = await db.payment.groupBy({ by: ['currency', 'status'], where: { paidAt: { gte: start, lte: end } }, _sum: { amountCents: true }, _count: true });
    return { columns: ['Currency', 'Status', 'Amount (minor units)', 'Payments'], rows: rows.map(r => [r.currency, r.status, r._sum.amountCents || 0, r._count]) };
  }
  if (type === 'subscriptions') {
    const rows = await db.subscription.findMany({ where: { createdAt: { gte: start, lte: end } }, include: { plan: true, user: { select: { email: true } } }, take: 10000 });
    return { columns: ['User', 'Plan', 'Status', 'Start (UTC)', 'End (UTC)'], rows: rows.map(r => [r.user.email, r.plan.name, r.status, r.startAt.toISOString(), r.endAt.toISOString()]) };
  }
  const data = await analytics(start, end);
  if (type === 'productivity') return { columns: ['Metric', 'Value', 'Scope'], rows: [
    ['Completed goals and actions', data.productivity.completed, 'All time'], ['Pending goals and actions', data.productivity.pending, 'All time'],
    ['Learning minutes', data.productivity.learningMinutes, 'Selected period'], ['Habit completions', data.productivity.habits, 'Selected period'],
    ['Average saved daily score', data.dailyScore, 'Selected period; saved scores only'],
  ] };
  return { columns: ['Date (UTC)', 'Tracker records', 'Active contributors', 'Registrations'], rows: data.graph.map(r => [r.date, r.activities, r.active, r.registrations]) };
}

export async function deliverNotification(tx: Prisma.TransactionClient, id: string) {
  const notification = await tx.notification.findUniqueOrThrow({ where: { id } });
  if (notification.status === 'sent') return notification;
  const settings = await tx.adminSettings.findUnique({ where: { id: 'app' } });
  if (settings && !settings.inAppEnabled) throw new AdminError(409, 'In-app notifications are disabled in settings.');
  const where = { status: 'active', ...(notification.audience === 'user' ? { id: notification.target } : notification.audience === 'role' ? { roleId: notification.target === 'member' ? null : notification.target } : {}) };
  // Keyset batches avoid loading every recipient into memory.
  let cursor: string | undefined;
  for (;;) {
    const users: { id: string }[] = await tx.user.findMany({ where, select: { id: true }, orderBy: { id: 'asc' }, take: 200, ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}) });
    if (!users.length) break;
    await tx.notificationReceipt.createMany({ data: users.map(user => ({ notificationId: id, userId: user.id })) });
    cursor = users[users.length - 1].id;
  }
  return tx.notification.update({ where: { id }, data: { status: 'sent', sentAt: new Date() } });
}
