import assert from 'node:assert/strict';
import { PrismaClient } from '@prisma/client';
import { resolve } from 'node:path';
import { mkdir, writeFile } from 'node:fs/promises';
const base = 'http://localhost:8091';
const db = new PrismaClient({ datasources: { db: { url: `file:${resolve('db/admin-test.db').replaceAll('\\', '/')}` } } });
let checks = 0;
const check = (actual, expected, name) => { assert.equal(actual, expected, name); checks++; };
async function call(path, cookie = '', method = 'GET', body, headers = {}) {
  const response = await fetch(`${base}/api/${path}`, { method, headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}), ...headers }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
  const text = await response.text(); let data; try { data = JSON.parse(text); } catch { throw new Error(`${path} returned ${response.status}: ${text.slice(0, 300)}`); }
  return { status: response.status, data: data.data, error: data.error, cookie: response.headers.getSetCookie().find(value => value.startsWith('lifeos-session=') && !value.startsWith('lifeos-session=;'))?.split(';')[0] };
}
try {
  await db.authAttempt.deleteMany();
  const sessions = {};
  for (const role of ['super', 'staff', 'support', 'analyst', 'member']) { const login = await call('auth/login', '', 'POST', { email: `${role}@admin-test.invalid`, password: 'Local-QA-only-428!' }); check(login.status, 200, `${role} login`); assert.ok(login.cookie); sessions[role] = login.cookie; }
  const admin = sessions.super, member = sessions.member;
  for (const endpoint of ['dashboard', 'users', 'analytics', 'activity', 'productivity', 'learning', 'plans', 'subscriptions', 'payments', 'reports', 'content', 'feedback', 'support', 'notifications', 'audit', 'settings', 'roles']) {
    check((await call(`admin/${endpoint}`)).status, 401, `unauthenticated ${endpoint}`);
    check((await call(`admin/${endpoint}`, member)).status, 403, `member denied ${endpoint}`);
    check((await call(`admin/${endpoint}`, admin)).status, 200, `admin ${endpoint}`);
  }
  check((await call('admin/users', 'lifeos-user-id=qa-super')).status, 401, 'forged legacy cookie');
  check((await call('admin/users', 'lifeos-session=qa-super')).status, 401, 'forged session cookie');
  check((await call('admin/settings', sessions.staff)).status, 403, 'staff settings denied');
  check((await call('admin/users', sessions.analyst)).status, 403, 'analyst users denied');
  check((await call('admin/payments', sessions.support)).status, 403, 'support billing denied');
  check((await call('admin/users/bulk', admin, 'POST', { ids: ['qa-member'], status: 'suspended' }, { Origin: 'https://other.invalid' })).status, 403, 'cross-origin rejected');
  check((await call('admin/users/bulk', admin, 'POST', { ids: ['qa-super'], status: 'deleted' })).status, 409, 'self-deletion denied');
  check((await call('admin/roles/super-admin', admin, 'PATCH', { name: 'Changed', permissions: [] })).status, 409, 'super role protected');
  check((await call('admin/users/qa-super', sessions.staff, 'PATCH', { name: 'Changed', email: 'super@admin-test.invalid', roleId: 'super-admin', status: 'active' })).status, 403, 'staff cannot change super');
  check((await call('admin/users/qa-member', sessions.staff, 'PATCH', { name: 'Alex Chen', email: 'member@admin-test.invalid', roleId: 'super-admin', status: 'active' })).status, 403, 'role escalation denied');
  check((await call('admin/plans', admin, 'POST', { name: 'Bad plan', priceCents: -1 })).status, 400, 'schema validation');
  check((await call('admin/users?page=0', admin)).status, 400, 'pagination validation');
  check((await call('admin/analytics?start=bad', admin)).status, 400, 'date validation');
  check((await call('admin/analytics?start=2026-02-31', admin)).status, 400, 'calendar-date validation');
  for (const resource of ['users', 'payments', 'subscriptions']) {
    const response = await fetch(`${base}/api/admin/${resource}/export`, { headers: { Cookie: admin } });
    check(response.status, 200, `${resource} CSV export`);
    assert.ok(response.headers.get('content-type').includes('text/csv'));
  }
  check((await call('admin/users/bulk', admin, 'POST', { ids: ['qa-member'], status: 'suspended' })).status, 200, 'suspension');
  check((await call('dashboard/today', member)).status, 401, 'suspension invalidates personal API session');
  check((await call('admin/users/bulk', admin, 'POST', { ids: ['qa-member'], status: 'active' })).status, 200, 'activation');
  const relogin = await call('auth/login', '', 'POST', { email: 'member@admin-test.invalid', password: 'Local-QA-only-428!' }); sessions.member = relogin.cookie;
  check((await call('dashboard/today', sessions.member)).status, 200, 'existing dashboard regression');
  const improvement = await call('improvements', sessions.member, 'POST', { title: 'Admin regression check', kind: 'action', category: 'Learning' }); check(improvement.status, 201, 'existing improvements create');
  check((await call(`improvements/${improvement.data.id}`, sessions.member, 'PATCH', { completed: true })).status, 200, 'existing improvement completion');
  const plan = await call('admin/plans', admin, 'POST', { name: 'QA Growth', priceCents: 49900, currency: 'INR', cycle: 'monthly', trialDays: 7, enabled: true, features: 'Learning\nHabit tracking', limits: 'Manual plan record' }); check(plan.status, 200, 'create plan');
  const subscription = await call('admin/subscriptions', admin, 'POST', { userId: 'qa-member', planId: plan.data.id, status: 'active', startAt: new Date().toISOString(), endAt: new Date(Date.now() + 30 * 86400000).toISOString() }); check(subscription.status, 200, 'create subscription');
  const paymentBody = { reference: `QA-${Date.now()}`, userId: 'qa-member', subscriptionId: subscription.data.id, amountCents: 49900, currency: 'INR', method: 'manual', status: 'successful', paidAt: new Date().toISOString(), note: 'Isolated QA ledger' };
  const payment = await call('admin/payments', admin, 'POST', paymentBody); check(payment.status, 200, 'record payment');
  check((await call(`admin/payments/${payment.data.id}`, admin, 'PATCH', { ...paymentBody, amountCents: 1 })).status, 409, 'settled amount immutable');
  check((await call(`admin/payments/${payment.data.id}`, admin, 'PATCH', { ...paymentBody, status: 'refunded' })).status, 200, 'record refund');
  const resource = await call('admin/content', admin, 'POST', { title: 'Welcome to the community', body: 'Small steps create meaningful progress.', category: 'guide', status: 'published' }); check(resource.status, 200, 'publish resource');
  const feedback = await call('community', sessions.member, 'POST', { type: 'feedback', title: 'A helpful suggestion', message: 'Please add a weekly reflection.', kind: 'suggestion' }); check(feedback.status, 200, 'member feedback submission');
  const feedbackRecord = (await call('admin/feedback', sessions.support)).data.items.find(r => r.id === feedback.data.id); assert.ok(feedbackRecord);
  check((await call(`admin/feedback/${feedback.data.id}`, sessions.support, 'PATCH', { userId: 'qa-member', title: feedbackRecord.title, message: feedbackRecord.message, kind: 'suggestion', rating: null, status: 'resolved', priority: 'normal', assignee: 'support@admin-test.invalid', resolution: 'Reviewed by support.' })).status, 200, 'resolve feedback');
  const notification = await call('admin/notifications', admin, 'POST', { title: 'QA personal update', message: 'A message in your LIFEOS inbox.', audience: 'user', target: 'qa-member', status: 'draft', scheduledAt: null }); check(notification.status, 200, 'draft notification');
  check((await call(`admin/notifications/${notification.data.id}/send`, admin, 'POST', {})).status, 200, 'deliver in-app notification');
  const inbox = (await call('community', sessions.member)).data;
  assert.ok(inbox.content.some(r => r.id === resource.data.id));
  const receipt = inbox.notifications.find(r => r.notification.title === 'QA personal update'); assert.ok(receipt);
  check((await call('community', admin, 'PATCH', { id: receipt.id })).status, 404, 'receipt ownership');
  check((await call('community', sessions.member, 'PATCH', { id: receipt.id })).status, 200, 'mark notification read');
  check((await call(`admin/notifications/${notification.data.id}/send`, admin, 'POST', {})).status, 200, 'idempotent delivery');
  check(await db.notificationReceipt.count({ where: { notificationId: notification.data.id } }), 1, 'no duplicate receipt');
  const report = await call('admin/reports', admin, 'POST', { name: 'QA usage snapshot', type: 'usage', start: new Date(Date.now() - 29 * 86400000).toISOString().slice(0, 10), end: new Date().toISOString().slice(0, 10) }); check(report.status, 200, 'generate report');
  await mkdir('tool-results/admin-qa', { recursive: true });
  for (const format of ['csv', 'xlsx', 'pdf']) { const response = await fetch(`${base}/api/admin/reports/${report.data.id}/download?format=${format}`, { headers: { Cookie: admin } }); check(response.status, 200, `${format} download`); const bytes = Buffer.from(await response.arrayBuffer()); await writeFile(`tool-results/admin-qa/report.${format}`, bytes); assert.ok(bytes.length > 100); if (format === 'pdf') check(bytes.subarray(0, 4).toString(), '%PDF', 'pdf signature'); if (format === 'xlsx') check(bytes.subarray(0, 2).toString(), 'PK', 'xlsx ZIP signature'); }
  check((await call('admin/reports', sessions.analyst, 'POST', { name: 'Denied user export', type: 'users', start: '2026-09-01', end: '2026-09-07' })).status, 403, 'report source permission');
  const audit = (await call('admin/audit?limit=100', admin)).data; assert.ok(audit.items.some(r => r.action === 'generated' && r.entity === 'reports'));
  assert.ok(!(JSON.stringify((await call('admin/users', admin)).data).includes('passwordHash')));
  const schedule = await db.notification.create({ data: { title: 'Scheduled QA', message: 'Scheduled in-app message', audience: 'user', target: 'qa-member', status: 'scheduled', scheduledAt: new Date(Date.now() - 60000) } });
  check((await call('internal/admin-jobs', '', 'POST', {})).status, 401, 'worker secret enforced');
  check((await call('internal/admin-jobs', '', 'POST', {}, { Authorization: 'Bearer isolated-admin-qa-secret-32-characters-only' })).status, 200, 'scheduled worker');
  check((await db.notification.findUnique({ where: { id: schedule.id } })).status, 'sent', 'scheduled delivery persisted');
  check((await call('auth/logout', sessions.member, 'POST', {})).status, 200, 'logout');
  check((await call('auth/me', sessions.member)).status, 401, 'logout revokes token');
  console.log(`PASS ${checks} admin API/security/regression checks.`);
} finally { await db.$disconnect(); }
