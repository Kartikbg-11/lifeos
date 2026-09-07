import { PrismaClient } from '@prisma/client';
import { spawnSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

// Run: node --env-file=.env scripts/admin-setup.mjs [existing-super-admin-email]
// No account is promoted unless its email is explicitly supplied.
const db = new PrismaClient();
const prisma = (...args) => {
  const result = spawnSync(process.execPath, ['node_modules/prisma/build/index.js', ...args], { stdio: 'inherit', env: process.env });
  if (result.status !== 0) throw new Error(`Prisma ${args[0]} failed.`);
};
try {
  const tables = await db.$queryRawUnsafe("SELECT name FROM sqlite_master WHERE type = 'table'");
  if (tables.some(t => t.name === 'User') && !tables.some(t => t.name === '_prisma_migrations')) {
    mkdirSync('db/backups', { recursive: true });
    const backup = resolve(`db/backups/pre-admin-${Date.now()}.db`).replaceAll("'", "''");
    await db.$executeRawUnsafe(`VACUUM INTO '${backup}'`);
    console.log(`Existing database backed up: ${backup}`);
    await db.$disconnect();
    prisma('migrate', 'resolve', '--applied', '202609070001_baseline');
  }
  await db.$disconnect();
  prisma('migrate', 'deploy');
  const permissionList = ['dashboard.read', 'users.read', 'users.write', 'users.delete', 'analytics.read', 'activity.read', 'productivity.read', 'billing.read', 'billing.write', 'reports.read', 'reports.write', 'content.read', 'content.write', 'feedback.read', 'feedback.write', 'support.read', 'support.write', 'notifications.read', 'notifications.write', 'audit.read', 'settings.read', 'settings.write'];
  const roles = [
    ['super-admin', 'Super Admin', ['*']],
    ['admin', 'Admin', permissionList.filter(p => !p.startsWith('settings.'))],
    ['manager', 'Manager', ['dashboard.read', 'users.read', 'analytics.read', 'activity.read', 'productivity.read', 'reports.read', 'reports.write', 'content.read', 'content.write', 'feedback.read', 'feedback.write']],
    ['support', 'Support', ['dashboard.read', 'users.read', 'activity.read', 'feedback.read', 'feedback.write', 'support.read', 'support.write']],
    ['analyst', 'Analyst', ['dashboard.read', 'analytics.read', 'productivity.read', 'reports.read', 'reports.write']],
  ];
  for (const [id, name, permissions] of roles) await db.adminRole.upsert({ where: { id }, create: { id, name, permissions: JSON.stringify(permissions) }, update: {} });
  await db.adminSettings.upsert({ where: { id: 'app' }, create: { id: 'app' }, update: {} });
  const email = process.argv[2]?.trim().toLowerCase();
  if (email) {
    const user = await db.user.findUnique({ where: { email }, select: { id: true, status: true, name: true, passwordHash: true } });
    if (!user || !user.passwordHash || user.status !== 'active') throw new Error('The supplied email must belong to an active registered account with a password.');
    await db.$transaction(async tx => {
      await tx.user.update({ where: { id: user.id }, data: { roleId: 'super-admin' } });
      await tx.authSession.deleteMany({ where: { userId: user.id } });
      await tx.auditEvent.create({ data: { actorName: 'Local setup command', action: 'super-admin-granted', entity: 'users', targetId: user.id, detail: 'Explicit email supplied to admin-setup.mjs' } });
    });
    console.log('Super Admin access granted. Sign in again at /login.');
  } else console.log('Schema and roles ready. No account was promoted. Supply an existing email to grant Super Admin access.');
} finally { await db.$disconnect(); }
