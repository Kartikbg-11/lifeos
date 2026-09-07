import assert from 'node:assert/strict';
import { PrismaClient } from '@prisma/client';
import { resolve } from 'node:path';
const db = new PrismaClient({ datasources: { db: { url: `file:${resolve('db/admin-test.db').replaceAll('\\', '/')}` } } });
const base = 'http://localhost:8091/api';
async function request(path, cookie = '', method = 'GET', body) { const r = await fetch(`${base}/${path}`, { method, headers: { Cookie: cookie, 'Content-Type': 'application/json' }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) }); return { status: r.status, body: await r.json(), cookie: r.headers.getSetCookie().find(v => v.startsWith('lifeos-session=') && !v.startsWith('lifeos-session=;'))?.split(';')[0] }; }
const login = async role => (await request('auth/login', '', 'POST', { email: `${role}@admin-test.invalid`, password: 'Local-QA-only-428!' })).cookie;
try {
  const admin = await login('super'), analyst = await login('analyst');
  const settings = (await request('admin/settings', admin)).body.data;
  const { id, updatedAt, ...input } = settings;
  assert.equal((await request('admin/settings', admin, 'PATCH', { ...input, passwordMinLength: 2 })).status, 400);
  assert.equal((await request('admin/settings', admin, 'PATCH', { ...input, registrationEnabled: false })).status, 200);
  assert.equal((await request('auth/register', '', 'POST', { email: 'closed@admin-test.invalid', name: 'Closed registration', password: 'Qa-register-928!' })).status, 403);
  assert.equal((await request('admin/settings', admin, 'PATCH', input)).status, 200);
  const registration = await request('auth/register', '', 'POST', { email: `register-${Date.now()}@admin-test.invalid`, name: 'Registration QA', password: 'Qa-register-928!', roleId: 'super-admin' });
  assert.equal(registration.status, 200);
  assert.equal((await db.user.findUnique({ where: { id: registration.body.data.id } })).roleId, null);
  const newRole = await request('admin/roles', admin, 'POST', { name: `QA role ${Date.now()}`, permissions: ['dashboard.read'] });
  assert.equal(newRole.status, 200);
  const original = await db.user.findUnique({ where: { id: 'qa-analyst' } });
  await db.user.update({ where: { id: original.id }, data: { roleId: newRole.body.data.id } });
  assert.equal((await request('admin/analytics', analyst)).status, 403);
  assert.equal((await request(`admin/roles/${newRole.body.data.id}`, admin, 'PATCH', { name: newRole.body.data.name, permissions: ['dashboard.read', 'analytics.read'] })).status, 200);
  assert.equal((await request('admin/analytics', analyst)).status, 200);
  await db.user.update({ where: { id: original.id }, data: { roleId: 'analyst' } });
  const schedule = await request('admin/schedules', admin, 'POST', { name: 'Scheduled usage QA', type: 'usage', frequency: 'weekly', enabled: true, nextRunAt: new Date(Date.now() - 60000).toISOString() });
  assert.equal(schedule.status, 200);
  const before = await db.adminReport.count({ where: { name: 'Scheduled usage QA' } });
  const run = () => fetch(`${base}/internal/admin-jobs`, { method: 'POST', headers: { Authorization: 'Bearer isolated-admin-qa-secret-32-characters-only' } });
  assert.equal((await run()).status, 200);
  assert.equal((await run()).status, 200);
  assert.equal(await db.adminReport.count({ where: { name: 'Scheduled usage QA' } }), before + 1);
  await db.authAttempt.deleteMany();
  for (let i = 0; i < 8; i++) assert.equal((await request('auth/login', '', 'POST', { email: 'nonexistent-throttle@admin-test.invalid', password: 'wrong' })).status, 401);
  assert.equal((await request('auth/login', '', 'POST', { email: 'nonexistent-throttle@admin-test.invalid', password: 'wrong' })).status, 429);
  const expire = await login('member');
  await db.authSession.updateMany({ where: { userId: 'qa-member' }, data: { expiresAt: new Date(Date.now() - 1) } });
  assert.equal((await request('auth/me', expire)).status, 401);
  for (const endpoint of ['fitness', 'learning', 'interview', 'sleep', 'food', 'water', 'expenses', 'habits', 'goals', 'journal', 'settings', 'dashboard/weekly', 'dashboard/monthly']) assert.equal((await request(endpoint, admin)).status, 200, endpoint);
  console.log('PASS role updates, registration policy, privilege injection, scheduled reports/idempotency, login throttling, session expiration, and 13 existing personal APIs.');
} finally {
  await db.user.updateMany({ where: { id: 'qa-analyst' }, data: { roleId: 'analyst' } });
  await db.adminSettings.update({ where: { id: 'app' }, data: { registrationEnabled: true } });
  await db.$disconnect();
}
