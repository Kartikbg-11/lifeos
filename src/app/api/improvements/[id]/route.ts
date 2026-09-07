import { db } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth';
import { improvementFields } from '@/lib/improvement';

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Context) {
  const user = await authenticateRequest();
  if (!user) return Response.json({ error: 'Not authenticated' }, { status: 401 });
  const { id } = await params;
  const parsed = improvementFields.partial().safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: 'Invalid improvement details.' }, { status: 400 });
  try {
    const result = await db.improvement.updateMany({ where: { id, userId: user.id }, data: parsed.data });
    if (!result.count) return Response.json({ error: 'Improvement not found' }, { status: 404 });
    return Response.json({ data: await db.improvement.findFirst({ where: { id, userId: user.id } }) });
  } catch {
    return Response.json({ error: 'Could not update your improvement.' }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: Context) {
  const user = await authenticateRequest();
  if (!user) return Response.json({ error: 'Not authenticated' }, { status: 401 });
  const { id } = await params;
  try {
    const result = await db.improvement.deleteMany({ where: { id, userId: user.id } });
    if (!result.count) return Response.json({ error: 'Improvement not found' }, { status: 404 });
    return Response.json({ success: true });
  } catch {
    return Response.json({ error: 'Could not delete your improvement.' }, { status: 500 });
  }
}
