import { NextResponse } from 'next/server';
import { removeAuthCookie, authenticateRequest } from '@/lib/auth';
import { db } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const origin = request.headers.get('origin');
    if (request.headers.get('sec-fetch-site') === 'cross-site' || (origin && origin !== new URL(request.url).origin)) return NextResponse.json({ success: false, error: 'Request origin is not allowed.' }, { status: 403 });
    const user = await authenticateRequest();
    if (user) {
      await db.activityEvent.create({ data: { userId: user.id, action: 'logout', feature: 'account' } });
      const account = await db.user.findUnique({ where: { id: user.id }, select: { roleId: true } });
      if (account?.roleId) await db.auditEvent.create({ data: { actorId: user.id, actorName: user.name || user.email, action: 'logout', entity: 'account', targetId: user.id } });
    }
    await removeAuthCookie();

    return NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
