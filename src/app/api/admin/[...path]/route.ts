import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { db } from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { adminResponse, requireAdmin, AdminError, audit, jsonBody, pagination, dateRange } from '@/lib/admin/server';
import { analytics, trackerActivity } from '@/lib/admin/analytics';
import { can, PERMISSIONS, type AdminIdentity, type Permission } from '@/lib/admin/permissions';
import { isResource, resourceConfig, resourcePermission, type Resource } from '@/lib/admin/resources';
import { deliverNotification, reportPermissions, reportSnapshot } from '@/lib/admin/reports';
import { csv, xlsx, pdf } from '@/lib/admin/exports';

export const runtime = 'nodejs';
type Context = { params: Promise<{ path: string[] }> };
const publicUser = { id: true, name: true, email: true, status: true, roleId: true, createdAt: true, lastActiveAt: true, role: { select: { id: true, name: true } } } satisfies Prisma.UserSelect;
function allow(actor: AdminIdentity, permission: Permission) { if (!can(actor.permissions, permission)) throw new AdminError(403, 'Your role does not allow this action.'); }
function superOnly(actor: AdminIdentity) { if (actor.roleId !== 'super-admin') throw new AdminError(403, 'Only a Super Admin can change access or schedule privileged reports.'); }
function reportAccess(actor: AdminIdentity, type: string) { if (!reportPermissions[type]) throw new AdminError(400, 'Unknown report type.'); allow(actor, reportPermissions[type]); }
const userSchema = z.object({ name: z.string().trim().min(1).max(100), email: z.string().trim().email().max(254).transform(v => v.toLowerCase()), status: z.enum(['active', 'suspended', 'deleted']), roleId: z.string().max(100).nullable() }).strict();

async function userList(url: URL, exporting = false) {
  const { page, limit, skip } = exporting ? { page: 1, limit: 10000, skip: 0 } : pagination(url);
  const q = (url.searchParams.get('q') || '').slice(0, 200);
  const status = url.searchParams.get('status');
  const role = url.searchParams.get('role');
  const sort = url.searchParams.get('sort') || 'createdAt';
  if (!['createdAt', 'name', 'email', 'lastActiveAt'].includes(sort)) throw new AdminError(400, 'Invalid sort column.');
  const where: Prisma.UserWhereInput = { ...(q ? { OR: [{ name: { contains: q } }, { email: { contains: q } }] } : {}), ...(status ? { status } : { status: { not: 'deleted' } }), ...(role ? { roleId: role === 'member' ? null : role } : {}) };
  const [items, total] = await Promise.all([
    db.user.findMany({ where, select: { ...publicUser, _count: { select: { goals: true, improvements: true, learningSessions: true } }, subscriptions: { where: { status: { in: ['active', 'trial'] }, endAt: { gt: new Date() } }, select: { status: true, plan: { select: { name: true } } }, take: 1 } }, orderBy: { [sort]: url.searchParams.get('direction') === 'asc' ? 'asc' : 'desc' }, skip, take: limit }),
    db.user.count({ where }),
  ]);
  return { items, total, page, limit };
}

async function resourceList(resource: Resource, url: URL, exporting = false) {
  const config = resourceConfig[resource];
  const { page, limit, skip } = exporting ? { page: 1, limit: 10000, skip: 0 } : pagination(url);
  const q = (url.searchParams.get('q') || '').slice(0, 200);
  const status = url.searchParams.get('status');
  const where: Record<string, unknown> = q ? { OR: config.search.map(field => ({ [field]: { contains: q } })) } : {};
  if (status && !['plans', 'schedules'].includes(resource)) where.status = status;
  if (url.searchParams.get('start') || url.searchParams.get('end')) { const range = dateRange(url); where[resource === 'payments' ? 'paidAt' : 'createdAt'] = { gte: range.start, lte: range.end }; }
  const include = resource === 'subscriptions' ? { user: { select: { id: true, name: true, email: true } }, plan: true }
    : ['payments', 'feedback', 'support'].includes(resource) ? { user: { select: { id: true, name: true, email: true } } }
    : resource === 'notifications' ? { _count: { select: { receipts: true } } } : undefined;
  // The model and all query fields are selected from the closed resource registry.
  const model = (db as any)[config.model];
  const [items, total] = await Promise.all([model.findMany({ where, include, orderBy: { createdAt: 'desc' }, skip, take: limit }), model.count({ where })]);
  return { items, total, page, limit };
}

async function validateRelated(tx: Prisma.TransactionClient, resource: Resource, data: any) {
  if (data.userId && !await tx.user.findFirst({ where: { id: data.userId, status: { not: 'deleted' } } })) throw new AdminError(400, 'Select an existing user.');
  if (data.assignee && !await tx.user.findFirst({ where: { email: data.assignee, roleId: { not: null }, status: 'active' } })) throw new AdminError(400, 'Assign this case to an active administrator email.');
  if (resource === 'subscriptions') {
    if (new Date(data.endAt) <= new Date(data.startAt)) throw new AdminError(400, 'The end date must follow the start date.');
    if (['active', 'trial'].includes(data.status) && new Date(data.endAt) <= new Date()) throw new AdminError(400, 'An active subscription needs a future end date.');
    if (!await tx.plan.findFirst({ where: { id: data.planId, enabled: true } })) throw new AdminError(400, 'Select an enabled plan.');
  }
  if (resource === 'payments' && data.subscriptionId) {
    const subscription = await tx.subscription.findUnique({ where: { id: data.subscriptionId }, include: { plan: true } });
    if (!subscription || subscription.userId !== data.userId || subscription.plan.currency !== data.currency) throw new AdminError(400, 'The subscription must belong to this user and use the same currency.');
  }
  if (resource === 'notifications') {
    if (data.status === 'scheduled' && (!data.scheduledAt || new Date(data.scheduledAt) <= new Date())) throw new AdminError(400, 'Choose a future notification time.');
    if (data.audience === 'user' && !await tx.user.findFirst({ where: { id: data.target, status: 'active' } })) throw new AdminError(400, 'Select an active target user.');
    if (data.audience === 'role' && data.target !== 'member' && !await tx.adminRole.findUnique({ where: { id: data.target } })) throw new AdminError(400, 'Select an existing role.');
  }
}

export async function GET(request: Request, context: Context) {
  const { path } = await context.params;
  const [section, id, action] = path;
  const url = new URL(request.url);
  if (id === 'export' && ['users', 'payments', 'subscriptions'].includes(section)) {
    try {
      const actor = await requireAdmin(section === 'users' ? 'users.read' : 'billing.read');
      const data = section === 'users' ? await userList(url, true) : await resourceList(section as Resource, url, true);
      const columns = section === 'users' ? ['Name', 'Email', 'Role', 'Status', 'Created (UTC)'] : section === 'payments' ? ['Reference', 'User', 'Amount (minor units)', 'Currency', 'Method', 'Status', 'Paid (UTC)'] : ['ID', 'User', 'Plan', 'Status', 'Start (UTC)', 'End (UTC)'];
      const rows = data.items.map((r: any) => section === 'users' ? [r.name, r.email, r.role?.name || 'Member', r.status, r.createdAt.toISOString()] : section === 'payments' ? [r.reference, r.user.email, r.amountCents, r.currency, r.method, r.status, r.paidAt.toISOString()] : [r.id, r.user.email, r.plan.name, r.status, r.startAt.toISOString(), r.endAt.toISOString()]);
      await audit(db, actor, 'exported', section, undefined, `CSV export, ${rows.length} rows (maximum 10000)`);
      return new Response(csv({ columns, rows }), { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="lifeos-${section}.csv"`, 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' } });
    } catch (error) { return adminResponse(async () => { throw error; }); }
  }
  if (section === 'reports' && id && action === 'download') {
    try {
      const actor = await requireAdmin('reports.read');
      const report = await db.adminReport.findUnique({ where: { id } });
      if (!report) throw new AdminError(404, 'Report not found.');
      reportAccess(actor, report.type);
      const format = url.searchParams.get('format') || 'csv';
      const data = JSON.parse(report.snapshot);
      const content = format === 'xlsx' ? xlsx(data) : format === 'pdf' ? pdf(report.name, data) : format === 'csv' ? csv(data) : null;
      if (content === null) throw new AdminError(400, 'Choose CSV, XLSX, or PDF.');
      await audit(db, actor, 'download', 'reports', id, format);
      return new Response(typeof content === 'string' ? content : new Uint8Array(content), { headers: { 'Content-Type': format === 'xlsx' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : format === 'pdf' ? 'application/pdf' : 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="lifeos-report-${id}.${format}"`, 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' } });
    } catch (error) { return adminResponse(async () => { throw error; }); }
  }
  return adminResponse(async () => {
    const actor = await requireAdmin();
    if (section === 'me') return { ...actor, branding: await db.adminSettings.findUnique({ where: { id: 'app' }, select: { appName: true, logoUrl: true } }) };
    if (section === 'options') {
      if (!['users.write', 'billing.write', 'feedback.write', 'support.write', 'notifications.write'].some(p => can(actor.permissions, p as Permission))) throw new AdminError(403, 'Access denied.');
      const q = (url.searchParams.get('q') || '').slice(0, 200);
      if (id === 'users') return db.user.findMany({ where: { status: { not: 'deleted' }, ...(q ? { OR: [{ email: { contains: q } }, { name: { contains: q } }] } : {}) }, select: { id: true, name: true, email: true }, take: 100, orderBy: { createdAt: 'desc' } });
      if (id === 'plans') { allow(actor, 'billing.write'); return db.plan.findMany({ where: { enabled: true }, take: 100, orderBy: { name: 'asc' } }); }
      if (id === 'roles') return db.adminRole.findMany({ select: { id: true, name: true } });
      throw new AdminError(404, 'Unknown lookup.');
    }
    if (section === 'dashboard' || section === 'analytics') {
      allow(actor, section === 'dashboard' ? 'dashboard.read' : 'analytics.read');
      const { start, end } = dateRange(url);
      return analytics(start, end, can(actor.permissions, 'billing.read'));
    }
    if (section === 'users') {
      allow(actor, 'users.read');
      if (!id) return userList(url);
      const user = await db.user.findUnique({ where: { id }, select: { ...publicUser, timezone: true, _count: { select: { fitnessEntries: true, learningSessions: true, goals: true, improvements: true, habitCompletions: true } } } });
      if (!user) throw new AdminError(404, 'User not found.');
      const [events, goals, improvements, subscriptions, payments, feedback, support] = await Promise.all([
        can(actor.permissions, 'activity.read') ? db.activityEvent.findMany({ where: { userId: id }, orderBy: { createdAt: 'desc' }, take: 30 }) : [],
        can(actor.permissions, 'productivity.read') ? db.goal.findMany({ where: { userId: id }, select: { id: true, title: true, isCompleted: true, endDate: true }, take: 30 }) : [],
        can(actor.permissions, 'productivity.read') ? db.improvement.findMany({ where: { userId: id, kind: 'action' }, select: { id: true, title: true, completed: true }, take: 30 }) : [],
        can(actor.permissions, 'billing.read') ? db.subscription.findMany({ where: { userId: id }, include: { plan: true }, take: 20 }) : [],
        can(actor.permissions, 'billing.read') ? db.payment.findMany({ where: { userId: id }, take: 20, orderBy: { paidAt: 'desc' } }) : [],
        can(actor.permissions, 'feedback.read') ? db.feedback.findMany({ where: { userId: id }, take: 20 }) : [],
        can(actor.permissions, 'support.read') ? db.supportTicket.findMany({ where: { userId: id }, take: 20 }) : [],
      ]);
      return { user, events, goals, improvements, subscriptions, payments, feedback, support };
    }
    if (section === 'activity' || section === 'audit') {
      allow(actor, section === 'audit' ? 'audit.read' : 'activity.read');
      const { page, limit, skip } = pagination(url); const { start, end } = dateRange(url);
      const q = (url.searchParams.get('q') || '').slice(0, 200);
      const actionFilter = url.searchParams.get('action');
      const feature = url.searchParams.get('feature');
      const userId = url.searchParams.get('userId');
      if (section === 'audit') {
        const where = { createdAt: { gte: start, lte: end }, ...(q ? { OR: [{ actorName: { contains: q } }, { detail: { contains: q } }, { action: { contains: q } }] } : {}), ...(actionFilter ? { action: actionFilter } : {}), ...(feature ? { entity: feature } : {}) };
        const [items, total] = await Promise.all([db.auditEvent.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: limit }), db.auditEvent.count({ where })]);
        return { items, total, page, limit };
      }
      const where: Prisma.ActivityEventWhereInput = { createdAt: { gte: start, lte: end }, ...(userId ? { userId } : {}), ...(q ? { OR: [{ action: { contains: q } }, { user: { email: { contains: q } } }] } : {}), ...(actionFilter ? { action: actionFilter } : {}), ...(feature ? { feature } : {}) };
      const [items, total, records] = await Promise.all([db.activityEvent.findMany({ where, include: { user: { select: { name: true, email: true } } }, orderBy: { createdAt: 'desc' }, skip, take: limit }), db.activityEvent.count({ where }), trackerActivity(start, end, userId || undefined)]);
      return { items, total, page, limit, records: records.map(r => ({ ...r, createdAt: new Date(Number(r.createdAt)).toISOString() })).filter(r => (!feature || r.feature.toLowerCase() === feature.toLowerCase()) && (!q || `${r.name} ${r.email} ${r.feature}`.toLowerCase().includes(q.toLowerCase()))) };
    }
    if (section === 'productivity' || section === 'learning') {
      allow(actor, 'productivity.read');
      const { page, limit, skip } = pagination(url); const { start, end } = dateRange(url);
      const q = (url.searchParams.get('q') || '').slice(0, 200);
      const user = { select: { name: true, email: true } };
      if (section === 'learning') {
        const where = { createdAt: { gte: start, lte: end }, ...(q ? { topic: { contains: q } } : {}) };
        const [items, total, metrics] = await Promise.all([db.learningSession.findMany({ where, select: { id: true, topic: true, duration: true, category: true, completed: true, createdAt: true, user }, skip, take: limit, orderBy: { createdAt: 'desc' } }), db.learningSession.count({ where }), analytics(start, end)]);
        return { items, total, page, limit, metrics: metrics.productivity };
      }
      const where = { ...(q ? { title: { contains: q } } : {}) };
      const [goals, improvements, total, metrics] = await Promise.all([db.goal.findMany({ where, select: { id: true, title: true, category: true, isCompleted: true, endDate: true, createdAt: true, user }, orderBy: { createdAt: 'desc' }, skip, take: limit }), db.improvement.findMany({ where: { ...where, kind: 'action' }, select: { id: true, title: true, category: true, completed: true, createdAt: true, user }, orderBy: { createdAt: 'desc' }, take: 100 }), db.goal.count({ where }), analytics(start, end)]);
      return { items: goals, improvements, total, page, limit, metrics: metrics.productivity };
    }
    if (section === 'reports') {
      allow(actor, 'reports.read');
      const types = Object.keys(reportPermissions).filter(type => can(actor.permissions, reportPermissions[type]));
      if (id) { const report = await db.adminReport.findUnique({ where: { id } }); if (!report) throw new AdminError(404, 'Report not found.'); reportAccess(actor, report.type); return { ...report, snapshot: JSON.parse(report.snapshot) }; }
      const { page, limit, skip } = pagination(url);
      const where = { type: { in: types } };
      const [items, total] = await Promise.all([db.adminReport.findMany({ where, select: { id: true, name: true, type: true, status: true, startAt: true, endAt: true, createdAt: true }, orderBy: { createdAt: 'desc' }, skip, take: limit }), db.adminReport.count({ where })]);
      return { items, total, page, limit, types };
    }
    if (section === 'settings') { allow(actor, 'settings.read'); return db.adminSettings.upsert({ where: { id: 'app' }, create: { id: 'app' }, update: {} }); }
    if (section === 'roles') {
      if (!can(actor.permissions, 'users.read') && !can(actor.permissions, 'settings.read')) throw new AdminError(403, 'Access denied.');
      return db.adminRole.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true, ...(actor.roleId === 'super-admin' ? { permissions: true } : {}) } });
    }
    if (section === 'search') {
      const q = (url.searchParams.get('q') || '').trim().slice(0, 100);
      if (q.length < 2) return [];
      const results: { id: string; title: string; subtitle: string; href: string }[] = [];
      if (can(actor.permissions, 'users.read')) (await db.user.findMany({ where: { status: { not: 'deleted' }, OR: [{ email: { contains: q } }, { name: { contains: q } }] }, select: publicUser, take: 5 })).forEach(u => results.push({ id: u.id, title: u.name || u.email, subtitle: u.email, href: `/admin/users/${u.id}` }));
      for (const resource of ['payments', 'feedback', 'support', 'content'] as const) if (can(actor.permissions, resourcePermission(resource))) {
        const data = await resourceList(resource, new URL(`http://local/?q=${encodeURIComponent(q)}&limit=4`));
        data.items.forEach((r: any) => results.push({ id: r.id, title: r.title || r.reference, subtitle: resource, href: `/admin/${resource}?q=${encodeURIComponent(q)}` }));
      }
      if (can(actor.permissions, 'productivity.read')) (await db.goal.findMany({ where: { title: { contains: q } }, select: { id: true, title: true }, take: 4 })).forEach(r => results.push({ id: r.id, title: r.title, subtitle: 'Goal', href: `/admin/productivity?q=${encodeURIComponent(q)}` }));
      if (can(actor.permissions, 'reports.read')) (await db.adminReport.findMany({ where: { name: { contains: q }, type: { in: Object.keys(reportPermissions).filter(t => can(actor.permissions, reportPermissions[t])) } }, select: { id: true, name: true }, take: 4 })).forEach(r => results.push({ id: r.id, title: r.name, subtitle: 'Report', href: '/admin/reports' }));
      return results;
    }
    if (isResource(section)) { allow(actor, resourcePermission(section)); if (section === 'schedules') superOnly(actor); return resourceList(section, url); }
    throw new AdminError(404, 'Admin endpoint not found.');
  });
}

async function protectUser(tx: Prisma.TransactionClient, actor: AdminIdentity, id: string, changes: { status?: string; roleId?: string | null }) {
  const target = await tx.user.findUniqueOrThrow({ where: { id } });
  if (target.roleId && actor.roleId !== 'super-admin') throw new AdminError(403, 'Only a Super Admin can manage staff accounts.');
  if (changes.roleId !== undefined && changes.roleId !== target.roleId) superOnly(actor);
  if (id === actor.id && ((changes.status && changes.status !== 'active') || (changes.roleId !== undefined && changes.roleId !== target.roleId))) throw new AdminError(409, 'You cannot remove your own admin access.');
  if (target.roleId === 'super-admin' && ((changes.status && changes.status !== 'active') || (changes.roleId !== undefined && changes.roleId !== 'super-admin'))) {
    if (await tx.user.count({ where: { roleId: 'super-admin', status: 'active' } }) <= 1) throw new AdminError(409, 'Keep at least one active Super Admin.');
  }
  return target;
}

async function mutate(request: Request, context: Context) {
  return adminResponse(async () => {
    const { path } = await context.params; const [section, id, action] = path;
    const actor = await requireAdmin(); const body = await jsonBody(request);
    if (section === 'users') {
      allow(actor, request.method === 'DELETE' || body.status === 'deleted' ? 'users.delete' : 'users.write');
      if (id === 'bulk') {
        const input = z.object({ ids: z.array(z.string()).min(1).max(100), status: z.enum(['active', 'suspended', 'deleted']) }).strict().parse(body);
        if (input.status === 'deleted') allow(actor, 'users.delete');
        await db.$transaction(async tx => {
          for (const userId of [...new Set(input.ids)]) {
            await protectUser(tx, actor, userId, input);
            await tx.user.update({ where: { id: userId }, data: { status: input.status } });
            if (input.status !== 'active') await tx.authSession.deleteMany({ where: { userId } });
            await audit(tx, actor, input.status, 'users', userId, 'Bulk account status change');
          }
        });
        return { updated: input.ids.length };
      }
      if (request.method === 'DELETE') {
        if (!id) throw new AdminError(400, 'Select a user.');
        await db.$transaction(async tx => { await protectUser(tx, actor, id, { status: 'deleted' }); await tx.user.update({ where: { id }, data: { status: 'deleted' } }); await tx.authSession.deleteMany({ where: { userId: id } }); await audit(tx, actor, 'deleted', 'users', id, 'Access removed; historical records retained'); });
        return { deleted: true };
      }
      if (!id) {
        const input = userSchema.extend({ password: z.string().min(8).max(256) }).parse(body);
        if (input.roleId) superOnly(actor);
        if (input.status === 'deleted') throw new AdminError(400, 'Create an active or suspended account.');
        const settings = await db.adminSettings.findUnique({ where: { id: 'app' } });
        if (input.password.length < (settings?.passwordMinLength || 8)) throw new AdminError(400, `Use at least ${settings?.passwordMinLength || 8} password characters.`);
        const passwordHash = await hashPassword(input.password);
        return db.$transaction(async tx => { const { password: _, ...fields } = input; const user = await tx.user.create({ data: { ...fields, passwordHash }, select: publicUser }); await audit(tx, actor, 'created', 'users', user.id); return user; });
      }
      const input = userSchema.parse(body);
      return db.$transaction(async tx => {
        await protectUser(tx, actor, id, input);
        const user = await tx.user.update({ where: { id }, data: input, select: publicUser });
        if (input.status !== 'active') await tx.authSession.deleteMany({ where: { userId: id } });
        await audit(tx, actor, 'updated', 'users', id, `Account details updated; status ${input.status}`);
        return user;
      });
    }
    if (section === 'reports') {
      allow(actor, 'reports.write');
      const input = z.object({ name: z.string().trim().min(1).max(160), type: z.enum(['users', 'usage', 'productivity', 'revenue', 'subscriptions']), start: z.string(), end: z.string() }).strict().parse(body);
      reportAccess(actor, input.type);
      const { start, end } = dateRange(new URL(`http://local/?start=${encodeURIComponent(input.start)}&end=${encodeURIComponent(input.end)}`));
      const snapshot = await reportSnapshot(input.type, start, end);
      return db.$transaction(async tx => { const report = await tx.adminReport.create({ data: { name: input.name, type: input.type, startAt: start, endAt: end, snapshot: JSON.stringify(snapshot) } }); await audit(tx, actor, 'generated', 'reports', report.id, input.type); return { id: report.id, name: report.name }; });
    }
    if (section === 'settings') {
      allow(actor, 'settings.write');
      const input = z.object({ appName: z.string().trim().min(1).max(40), logoUrl: z.string().max(500).refine(v => !v || /^\/[a-zA-Z0-9/_\-.]+$/.test(v), 'Use a local public asset path'), timezone: z.string().max(100).refine(v => { try { new Intl.DateTimeFormat('en', { timeZone: v }); return true; } catch { return false; } }, 'Choose a valid timezone'), dateFormat: z.enum(['dd MMM yyyy', 'yyyy-MM-dd', 'MM/dd/yyyy']), registrationEnabled: z.boolean(), passwordMinLength: z.number().int().min(8).max(64), sessionHours: z.number().int().min(1).max(720), inAppEnabled: z.boolean() }).strict().parse(body);
      return db.$transaction(async tx => { const settings = await tx.adminSettings.upsert({ where: { id: 'app' }, create: { id: 'app', ...input }, update: input }); await audit(tx, actor, 'updated', 'settings', 'app', 'Application preferences updated'); return settings; });
    }
    if (section === 'roles') {
      superOnly(actor);
      if (id === 'super-admin') throw new AdminError(409, 'The Super Admin role is immutable.');
      const input = z.object({ name: z.string().trim().min(2).max(60), permissions: z.array(z.enum(PERMISSIONS)).max(PERMISSIONS.length) }).strict().parse(body);
      return db.$transaction(async tx => { const role = id ? await tx.adminRole.update({ where: { id }, data: { ...input, permissions: JSON.stringify([...new Set(input.permissions)]) } }) : await tx.adminRole.create({ data: { id: crypto.randomUUID(), name: input.name, permissions: JSON.stringify([...new Set(input.permissions)]) } }); await audit(tx, actor, id ? 'updated' : 'created', 'roles', role.id); return role; });
    }
    if (section === 'security' && id === 'password') {
      const input = z.object({ currentPassword: z.string().min(1).max(256), newPassword: z.string().min(8).max(256) }).strict().parse(body);
      const { verifyPassword } = await import('@/lib/auth');
      const account = await db.user.findUniqueOrThrow({ where: { id: actor.id } });
      if (!account.passwordHash || !await verifyPassword(input.currentPassword, account.passwordHash)) throw new AdminError(400, 'The current password is incorrect.');
      const settings = await db.adminSettings.findUnique({ where: { id: 'app' } });
      if (input.newPassword.length < (settings?.passwordMinLength || 8)) throw new AdminError(400, `Use at least ${settings?.passwordMinLength || 8} characters.`);
      const passwordHash = await hashPassword(input.newPassword);
      await db.$transaction(async tx => { await tx.user.update({ where: { id: actor.id }, data: { passwordHash } }); await tx.authSession.deleteMany({ where: { userId: actor.id } }); await audit(tx, actor, 'password-changed', 'account', actor.id, 'All sessions revoked'); });
      return { signInRequired: true };
    }
    if (isResource(section)) {
      allow(actor, resourcePermission(section, true));
      if (section === 'schedules') superOnly(actor);
      if (section === 'notifications' && action === 'send' && id) {
        return db.$transaction(async tx => { const notification = await deliverNotification(tx, id); await audit(tx, actor, 'sent', 'notifications', id, 'In-app delivery'); return notification; }, { timeout: 30000 });
      }
      const config = resourceConfig[section];
      if (request.method === 'DELETE') {
        if (!id || !['content', 'feedback', 'support', 'notifications', 'plans', 'schedules'].includes(section)) throw new AdminError(405, 'Financial records cannot be deleted; update their status instead.');
        return db.$transaction(async tx => {
          const model = (tx as any)[config.model]; const record = await model.findUniqueOrThrow({ where: { id } });
          if (section === 'notifications' && record.status === 'sent') throw new AdminError(409, 'Sent notifications cannot be deleted.');
          await model.delete({ where: { id } }); await audit(tx, actor, 'deleted', section, id); return { deleted: true };
        });
      }
      const input = config.schema.parse(body);
      return db.$transaction(async tx => {
        await validateRelated(tx, section, input);
        const model = (tx as any)[config.model];
        if (id) {
          const existing = await model.findUniqueOrThrow({ where: { id } });
          if (section === 'notifications' && existing.status === 'sent') throw new AdminError(409, 'Sent notifications are immutable.');
          if (section === 'payments' && ['successful', 'refunded'].includes(existing.status)) {
            const payment = input as any;
            if (payment.amountCents !== existing.amountCents || payment.currency !== existing.currency || payment.userId !== existing.userId || payment.reference !== existing.reference || !['successful', 'refunded'].includes(payment.status) || (existing.status === 'refunded' && payment.status !== 'refunded')) throw new AdminError(409, 'Settled amounts and ownership are immutable. Record a refund status if appropriate.');
          }
        }
        const record = id ? await model.update({ where: { id }, data: input }) : await model.create({ data: input });
        await audit(tx, actor, id ? 'updated' : 'created', section, record.id);
        return record;
      });
    }
    throw new AdminError(404, 'Admin endpoint not found.');
  });
}
export const POST = mutate;
export const PATCH = mutate;
export const DELETE = mutate;
