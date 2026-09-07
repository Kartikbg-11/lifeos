import { db } from '@/lib/db';
import { deliverNotification, reportSnapshot } from './reports';

export async function runAdminJobs() {
  const now = new Date(); const results: { type: string; id: string; status: string }[] = [];
  const notifications = await db.notification.findMany({ where: { status: 'scheduled', scheduledAt: { lte: now } }, select: { id: true }, take: 100 });
  for (const item of notifications) {
    try {
      await db.$transaction(async tx => {
        const current = await tx.notification.findUnique({ where: { id: item.id } });
        if (current?.status !== 'scheduled' || !current.scheduledAt || current.scheduledAt > now) return;
        await deliverNotification(tx, item.id);
        await tx.auditEvent.create({ data: { actorName: 'Scheduled job', action: 'sent', entity: 'notifications', targetId: item.id, detail: 'Scheduled in-app delivery' } });
      }, { timeout: 30000 });
      results.push({ type: 'notification', id: item.id, status: 'processed' });
    } catch { results.push({ type: 'notification', id: item.id, status: 'failed; will retry' }); }
  }
  const schedules = await db.reportSchedule.findMany({ where: { enabled: true, nextRunAt: { lte: now } }, take: 30 });
  for (const schedule of schedules) {
    try {
      const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) - 1);
      const days = schedule.frequency === 'daily' ? 1 : schedule.frequency === 'weekly' ? 7 : 30;
      const start = new Date(+end + 1 - days * 86400000);
      const snapshot = await reportSnapshot(schedule.type, start, end);
      const next = new Date(now);
      if (schedule.frequency === 'monthly') next.setUTCMonth(next.getUTCMonth() + 1); else next.setUTCDate(next.getUTCDate() + days);
      await db.$transaction(async tx => {
        const claimed = await tx.reportSchedule.updateMany({ where: { id: schedule.id, enabled: true, nextRunAt: schedule.nextRunAt }, data: { nextRunAt: next } });
        if (!claimed.count) return;
        const report = await tx.adminReport.create({ data: { name: schedule.name, type: schedule.type, startAt: start, endAt: end, snapshot: JSON.stringify(snapshot) } });
        await tx.auditEvent.create({ data: { actorName: 'Scheduled job', action: 'generated', entity: 'reports', targetId: report.id, detail: `Schedule ${schedule.id}` } });
      });
      results.push({ type: 'report', id: schedule.id, status: 'processed' });
    } catch { results.push({ type: 'report', id: schedule.id, status: 'failed; will retry' }); }
  }
  await db.$transaction(async tx => {
    const expired = await tx.subscription.findMany({ where: { status: { in: ['active', 'trial'] }, endAt: { lte: now } }, select: { id: true }, take: 500 });
    for (const subscription of expired) {
      await tx.subscription.update({ where: { id: subscription.id }, data: { status: 'expired' } });
      await tx.auditEvent.create({ data: { actorName: 'Scheduled job', action: 'expired', entity: 'subscriptions', targetId: subscription.id } });
    }
  });
  await db.authSession.deleteMany({ where: { expiresAt: { lte: now } } });
  await db.authAttempt.deleteMany({ where: { windowStart: { lt: new Date(+now - 86400000) } } });
  return results;
}
