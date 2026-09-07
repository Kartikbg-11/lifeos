import { authenticateRequest } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';
import { adminResponse, AdminError, jsonBody } from '@/lib/admin/server';

export async function GET() {
  return adminResponse(async () => {
    const user = await authenticateRequest(); if (!user) throw new AdminError(401, 'Please sign in.');
    const [notifications, content, feedback, support] = await Promise.all([
      db.notificationReceipt.findMany({ where: { userId: user.id }, include: { notification: { select: { title: true, message: true } } }, orderBy: { createdAt: 'desc' }, take: 100 }),
      db.contentPost.findMany({ where: { status: 'published' }, orderBy: { createdAt: 'desc' }, take: 100 }),
      db.feedback.findMany({ where: { userId: user.id }, select: { id: true, title: true, message: true, status: true, createdAt: true }, orderBy: { createdAt: 'desc' }, take: 50 }),
      db.supportTicket.findMany({ where: { userId: user.id }, select: { id: true, title: true, message: true, status: true, createdAt: true }, orderBy: { createdAt: 'desc' }, take: 50 }),
    ]);
    return { notifications, content, feedback, support };
  });
}

export async function POST(request: Request) {
  return adminResponse(async () => {
    const user = await authenticateRequest(); if (!user) throw new AdminError(401, 'Please sign in.');
    const input = z.object({ type: z.enum(['feedback', 'support']), title: z.string().trim().min(1).max(160), message: z.string().trim().min(1).max(10000), kind: z.enum(['suggestion', 'bug', 'complaint', 'feature-request']).optional(), rating: z.number().int().min(1).max(5).optional() }).strict().parse(await jsonBody(request));
    const { type, kind, rating, ...fields } = input;
    const recent = type === 'feedback' ? await db.feedback.count({ where: { userId: user.id, createdAt: { gte: new Date(Date.now() - 3600000) } } }) : await db.supportTicket.count({ where: { userId: user.id, createdAt: { gte: new Date(Date.now() - 3600000) } } });
    if (recent >= 10) throw new AdminError(429, 'Please wait before submitting more requests.');
    return type === 'feedback' ? db.feedback.create({ data: { ...fields, userId: user.id, kind: kind || 'suggestion', rating }, select: { id: true } }) : db.supportTicket.create({ data: { ...fields, userId: user.id }, select: { id: true } });
  });
}

export async function PATCH(request: Request) {
  return adminResponse(async () => {
    const user = await authenticateRequest(); if (!user) throw new AdminError(401, 'Please sign in.');
    const { id } = z.object({ id: z.string() }).strict().parse(await jsonBody(request));
    const result = await db.notificationReceipt.updateMany({ where: { id, userId: user.id }, data: { readAt: new Date() } });
    if (!result.count) throw new AdminError(404, 'Notification not found.');
    return { read: true };
  });
}
