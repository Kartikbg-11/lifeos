import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { resolve } from 'node:path';
import { writeFile } from 'node:fs/promises';

export async function seed({ databaseUrl, runId, directory, baseUrl, password, jobSecret }) {
  const expected = `file:${resolve(directory, 'lifeos.db').replaceAll('\\', '/')}`;
  if (databaseUrl !== expected || !directory.includes(`${runId}`) || !runId.startsWith('selenium-')) throw new Error('Refusing to seed outside the dedicated Selenium run directory.');
  const db = new PrismaClient({ datasources: { db: { url: databaseUrl } } });
  try {
    if (await db.user.count()) throw new Error('The Selenium seed requires a fresh database.');
    const passwordHash = await bcrypt.hash(password, 12);
    const accounts = [['super', 'Selenium Administrator', 'super-admin'], ['staff', 'Selenium Staff', 'admin'], ['manager', 'Selenium Manager', 'manager'], ['support', 'Selenium Support', 'support'], ['analyst', 'Selenium Analyst', 'analyst'], ['member', 'Selenium Member', null], ['rotation', 'Password Rotation', 'admin']];
    const properties = { 'base.url': baseUrl, 'run.id': runId, 'sandbox.name': 'LIFEOS QA', 'account.password': password, 'jobs.secret': jobSecret };
    for (const [key, name, roleId] of accounts) {
      const id = `${runId}-${key}`, email = `${key}@${runId}.test.invalid`;
      await db.user.create({ data: { id, email, name, roleId, passwordHash, timezone: 'UTC' } });
      properties[`account.${key}.id`] = id; properties[`account.${key}.email`] = email;
    }
    const today = new Date().toISOString().slice(0, 10);
    for (let index = 0; index < 25; index++) {
      const id = `${runId}-community-${index}`;
      await db.user.create({ data: { id, name: `Community Member ${String(index).padStart(2, '0')}`, email: `community-${index}@${runId}.test.invalid`, passwordHash, timezone: 'UTC', createdAt: new Date(Date.now() - (index + 1) * 86400000) } });
      await db.learningSession.create({ data: { userId: id, date: today, topic: `Selenium learning ${index}`, category: 'other', duration: 30 + index, completed: index % 2 === 0 } });
      await db.goal.create({ data: { userId: id, title: `Selenium goal ${index}`, type: 'monthly', category: 'learning', startDate: today, isCompleted: index % 2 === 0 } });
      await db.improvement.create({ data: { userId: id, title: `Selenium next step ${index}`, kind: 'action', completed: index % 3 === 0 } });
    }
    await db.adminSettings.update({ where: { id: 'app' }, data: { appName: 'LIFEOS QA', timezone: 'UTC', registrationEnabled: true, inAppEnabled: true, passwordMinLength: 8, sessionHours: 24 } });
    const configFile = resolve(directory, 'config.properties');
    await writeFile(configFile, Object.entries(properties).map(([key, value]) => `${key}=${value}`).join('\n') + '\n', { mode: 0o600 });
    return configFile;
  } finally { await db.$disconnect(); }
}
