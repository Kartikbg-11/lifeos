import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { resolve } from 'node:path';
const db = new PrismaClient({ datasources: { db: { url: `file:${resolve('db/admin-test.db').replaceAll('\\', '/')}` } } });
export const testPassword = 'Local-QA-only-428!';
try {
  const passwordHash = await bcrypt.hash(testPassword, 10);
  const accounts = [['super', 'Avery Morgan', 'super-admin'], ['staff', 'Sam Rivera', 'admin'], ['support', 'Jordan Lee', 'support'], ['analyst', 'Taylor Brooks', 'analyst'], ['member', 'Alex Chen', null]];
  for (const [id, name, roleId] of accounts) await db.user.upsert({ where: { email: `${id}@admin-test.invalid` }, create: { id: `qa-${id}`, email: `${id}@admin-test.invalid`, name, roleId, passwordHash }, update: { roleId, passwordHash, status: 'active' } });
  if (!await db.learningSession.count()) {
    const names = ['Maya Patel', 'Oliver Wilson', 'Priya Shah', 'Noah Williams', 'Sofia Garcia', 'Ethan Davis', 'Isabella Rossi', 'Liam Johnson', 'Zara Ahmed', 'Lucas Martin', 'Aisha Khan', 'Leo Brown'];
    for (let i = 0; i < names.length; i++) {
      const createdAt = new Date(Date.now() - (i * 2 + 1) * 86400000);
      await db.user.create({ data: { id: `qa-community-${i}`, email: `member${i}@admin-test.invalid`, name: names[i], createdAt, passwordHash, lastActiveAt: new Date(Date.now() - i * 3600000) } });
    }
    const today = new Date(); today.setUTCHours(10, 0, 0, 0);
    for (let day = 0; day < 30; day++) {
      const createdAt = new Date(+today - day * 86400000), date = createdAt.toISOString().slice(0, 10);
      for (let i = 0; i < Math.max(1, 12 - Math.floor(day / 3)); i++) {
        const userId = `qa-community-${i}`;
        await db.learningSession.create({ data: { userId, date, topic: ['Building better habits', 'Learning TypeScript', 'Deep work practice'][i % 3], category: 'other', duration: 20 + i * 5, completed: true, createdAt } });
        if (i % 2 === 0) await db.fitnessEntry.create({ data: { userId, date, workoutDuration: 30, workoutType: 'strength', completed: true, createdAt } });
        if (i % 3 === 0) await db.waterEntry.create({ data: { userId, date, amount: 500, createdAt } });
      }
    }
    for (let i = 0; i < 12; i++) {
      await db.goal.create({ data: { userId: `qa-community-${i}`, title: ['Finish a learning milestone', 'Build a morning routine', 'Move a little every day'][i % 3], type: 'monthly', category: 'learning', startDate: today.toISOString().slice(0, 10), isCompleted: i < 8 } });
      await db.improvement.create({ data: { userId: `qa-community-${i}`, title: 'Make time for focused practice', kind: 'action', completed: i < 5 } });
    }
  }
  console.log('Isolated QA fixtures ready. No production user data changed.');
} finally { await db.$disconnect(); }
