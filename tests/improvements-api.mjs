import assert from 'node:assert/strict';
import { PrismaClient } from '@prisma/client';
import { createHash, randomBytes } from 'node:crypto';

const db = new PrismaClient();
const base = process.env.TEST_BASE_URL || 'http://localhost:8090';
const users = [];
async function call(path, method = 'GET', user, body) {
  const response = await fetch(`${base}/api/improvements${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(user ? { Cookie: `lifeos-session=${user.token}` } : {}) },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  return { status: response.status, body: await response.json() };
}
try {
  for (let i = 0; i < 2; i++) {
    const user = await db.user.create({ data: { email: `improvement-test-${crypto.randomUUID()}@example.invalid`, name: 'Temporary API test' } });
    const token = randomBytes(32).toString('hex');
    await db.authSession.create({ data: { id: createHash('sha256').update(token).digest('hex'), userId: user.id, expiresAt: new Date(Date.now() + 3600000) } });
    users.push({ ...user, token });
  }
  assert.equal((await call('')).status, 401);
  assert.equal((await call('', 'POST', undefined, { title: 'Denied' })).status, 401);
  assert.equal((await call('', 'POST', users[0], { title: ' ' })).status, 400);
  assert.equal((await call('', 'POST', users[0], { title: 'Invalid', category: 'Unknown' })).status, 400);
  assert.equal((await call('', 'POST', users[0], { title: 'Long', content: 'x'.repeat(5001) })).status, 400);
  const created = await call('', 'POST', users[0], { title: 'Test reflection', content: 'A useful observation', category: 'Learning' });
  assert.equal(created.status, 201);
  const id = created.body.data.id;
  assert.equal((await call('')).status, 401);
  assert.equal((await call('', 'GET', users[0])).body.data[0].content, 'A useful observation');
  assert.equal((await call('', 'GET', users[1])).body.data.length, 0);
  assert.equal((await call(`/${id}`, 'PATCH', users[1], { title: 'Not mine' })).status, 404);
  assert.equal((await call(`/${id}`, 'DELETE', users[1])).status, 404);
  assert.equal((await call(`/${id}`, 'PATCH', users[0], { completed: 'yes' })).status, 400);
  const pinned = await call(`/${id}`, 'PATCH', users[0], { pinned: true });
  assert.equal(pinned.body.data.pinned, true);
  assert.equal(pinned.body.data.content, 'A useful observation');
  assert.equal(pinned.body.data.category, 'Learning');
  assert.equal(pinned.body.data.kind, 'note');
  assert.equal((await call(`/${id}`, 'PATCH', users[0], { kind: 'action' })).body.data.kind, 'action');
  assert.equal((await call(`/${id}`, 'PATCH', users[0], { completed: true })).body.data.completed, true);
  assert.equal((await call(`/${id}`, 'PATCH', users[0], { completed: false, title: 'Edited action' })).body.data.title, 'Edited action');
  const persisted = (await call('', 'GET', users[0])).body.data[0];
  assert.equal(persisted.completed, false);
  assert.equal(persisted.pinned, true);
  assert.equal(persisted.kind, 'action');
  assert.equal((await call(`/${id}`, 'DELETE', users[0])).status, 200);
  assert.equal((await call('', 'GET', users[0])).body.data.length, 0);
  assert.equal((await call(`/${id}`, 'DELETE', users[0])).status, 404);
  console.log('PASS: validation, authentication, account isolation, persistence, editing, pinning, conversion, completion, reopening, deletion.');
} finally {
  await db.user.deleteMany({ where: { id: { in: users.map(user => user.id) } } });
  await db.$disconnect();
}
