import { db } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth';
import { improvementSchema } from '@/lib/improvement';

export async function GET() {
  const user = await authenticateRequest();
  if (!user) return Response.json({ error: 'Not authenticated' }, { status: 401 });
  try {
    const data = await db.improvement.findMany({ where: { userId: user.id }, orderBy: [{ pinned: 'desc' }, { createdAt: 'desc' }] });
    return Response.json({ data });
  } catch {
    return Response.json({ error: 'Could not load your improvements. Please try again.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await authenticateRequest();
  if (!user) return Response.json({ error: 'Not authenticated' }, { status: 401 });
  const parsed = improvementSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: 'Enter a title (up to 120 characters), a valid category, and notes under 5,000 characters.' }, { status: 400 });
  try {
    const data = await db.improvement.create({ data: { ...parsed.data, userId: user.id } });
    return Response.json({ data }, { status: 201 });
  } catch {
    return Response.json({ error: 'Could not save your improvement. Please try again.' }, { status: 500 });
  }
}
