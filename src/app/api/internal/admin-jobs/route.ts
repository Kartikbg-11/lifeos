import { timingSafeEqual } from 'node:crypto';
import { runAdminJobs } from '@/lib/admin/jobs';

export async function POST(request: Request) {
  const secret = process.env.ADMIN_JOBS_SECRET;
  if (!secret || secret.length < 32) return Response.json({ error: 'Job runner is not configured.' }, { status: 503 });
  const expected = Buffer.from(`Bearer ${secret}`), supplied = Buffer.from(request.headers.get('authorization') || '');
  if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  try { return Response.json({ data: await runAdminJobs() }); } catch { return Response.json({ error: 'Job execution failed. Retry later.' }, { status: 500 }); }
}
