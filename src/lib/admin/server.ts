import { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth';
import { can, type Permission, type AdminIdentity } from './permissions';
import { ZodError } from 'zod';

export class AdminError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export function verifyOrigin(request: Request) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) return;
  const origin = request.headers.get('origin');
  if (request.headers.get('sec-fetch-site') === 'cross-site' || (origin && origin !== new URL(request.url).origin)) {
    throw new AdminError(403, 'This request must come from LIFEOS.');
  }
  if (!request.headers.get('content-type')?.includes('application/json')) throw new AdminError(415, 'Use a JSON request.');
}

export async function requireAdmin(permission?: Permission): Promise<AdminIdentity> {
  const user = await authenticateRequest();
  if (!user) throw new AdminError(401, 'Please sign in to continue.');
  const account = await db.user.findUnique({ where: { id: user.id }, include: { role: true } });
  if (!account?.role) throw new AdminError(403, 'Administrator access is required.');
  const permissions: string[] = account.roleId === 'super-admin' ? ['*'] : JSON.parse(account.role.permissions);
  if (permission && !can(permissions, permission)) throw new AdminError(403, 'Your role does not allow this action.');
  return { id: user.id, name: user.name, email: user.email, roleId: account.role.id, roleName: account.role.name, permissions };
}

export function audit(tx: Prisma.TransactionClient, actor: AdminIdentity, action: string, entity: string, targetId?: string, detail = '') {
  return tx.auditEvent.create({ data: { actorId: actor.id, actorName: actor.name || actor.email, action, entity, targetId, detail } });
}

export async function adminResponse(run: () => Promise<unknown>) {
  try {
    return Response.json({ data: await run() }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    if (error instanceof AdminError) return Response.json({ error: error.message }, { status: error.status });
    if (error instanceof ZodError) return Response.json({ error: error.issues.map(i => `${i.path.join('.') || 'Input'}: ${i.message}`).join('; ') }, { status: 400 });
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') return Response.json({ error: 'A record with those unique details already exists.' }, { status: 409 });
      if (error.code === 'P2025') return Response.json({ error: 'This record no longer exists.' }, { status: 404 });
      if (error.code === 'P2003') return Response.json({ error: 'This record is in use or a related record does not exist.' }, { status: 409 });
    }
    console.error('Admin request failed:', error instanceof Error ? error.message : 'Unknown error');
    return Response.json({ error: 'Unable to complete this request. Please try again.' }, { status: 500 });
  }
}

export async function jsonBody(request: Request) {
  verifyOrigin(request);
  const text = await request.text();
  if (text.length > 100_000) throw new AdminError(413, 'This request is too large.');
  try { const value = JSON.parse(text); if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(); return value; } catch { throw new AdminError(400, 'Enter a JSON object.'); }
}

export function pagination(url: URL) {
  const page = Number(url.searchParams.get('page') || 1);
  const limit = Number(url.searchParams.get('limit') || 20);
  if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1 || limit > 100) throw new AdminError(400, 'Invalid pagination.');
  return { page, limit, skip: (page - 1) * limit };
}

export function dateRange(url: URL) {
  for (const key of ['start', 'end']) {
    const value = url.searchParams.get(key);
    if (value) {
      const parsed = new Date(`${value}T00:00:00.000Z`);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(+parsed) || parsed.toISOString().slice(0, 10) !== value) throw new AdminError(400, 'Enter valid calendar dates.');
    }
  }
  const days = Number(url.searchParams.get('days') || 30);
  if (![1, 7, 30, 90, 365].includes(days)) throw new AdminError(400, 'Choose a supported date range.');
  const end = url.searchParams.get('end') ? new Date(`${url.searchParams.get('end')}T23:59:59.999Z`) : new Date();
  const start = url.searchParams.get('start') ? new Date(`${url.searchParams.get('start')}T00:00:00.000Z`) : new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate() - days + 1));
  if (!Number.isFinite(+start) || !Number.isFinite(+end) || start > end || +end - +start > 366 * 86400000) throw new AdminError(400, 'Choose a valid range of up to one year.');
  return { start, end };
}
