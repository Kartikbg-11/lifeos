import { NextResponse } from 'next/server';
import { createHash } from 'node:crypto';
import { z } from 'zod';
import { db } from '@/lib/db';
import { verifyPassword, setAuthCookie, removeAuthCookie } from '@/lib/auth';
import { verifyOrigin } from '@/lib/admin/server';

export async function POST(request: Request) {
  try {
    verifyOrigin(request);
    const input = z.object({ email: z.string().trim().email().max(254).transform(v => v.toLowerCase()), password: z.string().min(1).max(256) }).safeParse(await request.json().catch(() => null));
    if (!input.success) return NextResponse.json({ success: false, error: 'Enter a valid email and password.' }, { status: 400 });
    const { email, password } = input.data;
    const key = createHash('sha256').update(email).digest('hex');
    await db.authAttempt.deleteMany({ where: { id: key, windowStart: { lt: new Date(Date.now() - 15 * 60000) } } });
    const attempt = await db.authAttempt.upsert({ where: { id: key }, create: { id: key, count: 1 }, update: { count: { increment: 1 } } });
    if (attempt.count > 8) return NextResponse.json({ success: false, error: 'Too many attempts. Please try again in 15 minutes.' }, { status: 429 });
    const user = await db.user.findUnique({ where: { email } });
    if (!user?.passwordHash || user.status !== 'active' || !await verifyPassword(password, user.passwordHash)) return NextResponse.json({ success: false, error: 'Invalid email or password, or this account is unavailable.' }, { status: 401 });
    await db.$transaction(async tx => {
      await tx.authAttempt.deleteMany({ where: { id: key } });
      await tx.user.update({ where: { id: user.id }, data: { lastActiveAt: new Date() } });
      await tx.activityEvent.create({ data: { userId: user.id, action: 'login', feature: 'account' } });
      if (user.roleId) await tx.auditEvent.create({ data: { actorId: user.id, actorName: user.name || user.email, action: 'login', entity: 'account', targetId: user.id } });
    });
    await removeAuthCookie();
    await setAuthCookie(user.id);
    return NextResponse.json({ success: true, data: {
      id: user.id, email: user.email, name: user.name, roleId: user.roleId,
      settings: { workoutGoal: user.workoutGoal, pushupGoal: user.pushupGoal, learningGoal: user.learningGoal, interviewGoal: user.interviewGoal, sleepGoal: user.sleepGoal, waterGoal: user.waterGoal, proteinGoal: user.proteinGoal, currency: user.currency, timezone: user.timezone },
    } });
  } catch (error) {
    const forbidden = error instanceof Error && 'status' in error && error.status === 403;
    return NextResponse.json({ success: false, error: forbidden ? 'Request origin is not allowed.' : 'Unable to sign in. Please try again.' }, { status: forbidden ? 403 : 500 });
  }
}
