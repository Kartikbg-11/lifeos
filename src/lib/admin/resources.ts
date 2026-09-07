import { z } from 'zod';
import type { Permission } from './permissions';

const title = z.string().trim().min(1).max(160);
const text = z.string().max(10000);
const id = z.string().min(1).max(100);
const date = z.string().datetime({ offset: true });
const currency = z.string().regex(/^[A-Z]{3}$/).refine(v => ['INR', 'USD', 'EUR', 'GBP', 'AUD', 'CAD'].includes(v), 'Unsupported currency');
const priority = z.enum(['low', 'normal', 'high', 'urgent']);
const caseFields = { userId: id, title, message: text.min(1), status: z.enum(['open', 'in-progress', 'resolved', 'closed']).default('open'), priority: priority.default('normal'), assignee: z.string().max(100).default(''), resolution: text.default('') };

export const resourceConfig = {
  plans: { model: 'plan', permission: 'billing', search: ['name', 'features'], schema: z.object({ name: title, priceCents: z.number().int().min(0).max(100000000), currency, cycle: z.enum(['monthly', 'yearly']), features: text, limits: z.string().max(2000).default(''), trialDays: z.number().int().min(0).max(365), enabled: z.boolean() }).strict() },
  subscriptions: { model: 'subscription', permission: 'billing', search: ['id'], schema: z.object({ userId: id, planId: id, status: z.enum(['trial', 'active', 'cancelled', 'expired']), startAt: date, endAt: date }).strict() },
  payments: { model: 'payment', permission: 'billing', search: ['reference', 'note'], schema: z.object({ reference: title, userId: id, subscriptionId: id.nullable().optional(), amountCents: z.number().int().min(1).max(100000000), currency, method: z.enum(['manual', 'bank-transfer', 'upi', 'card', 'cash']), status: z.enum(['pending', 'successful', 'failed', 'refunded']), note: z.string().max(2000), paidAt: date }).strict() },
  content: { model: 'contentPost', permission: 'content', search: ['title', 'body'], schema: z.object({ title, body: text.min(1), category: z.enum(['guide', 'announcement', 'learning']), status: z.enum(['draft', 'published', 'archived']) }).strict() },
  feedback: { model: 'feedback', permission: 'feedback', search: ['title', 'message'], schema: z.object({ ...caseFields, kind: z.enum(['suggestion', 'bug', 'complaint', 'feature-request']), rating: z.number().int().min(1).max(5).nullable().optional() }).strict() },
  support: { model: 'supportTicket', permission: 'support', search: ['title', 'message'], schema: z.object(caseFields).strict() },
  notifications: { model: 'notification', permission: 'notifications', search: ['title', 'message'], schema: z.object({ title, message: text.min(1), audience: z.enum(['all', 'role', 'user']), target: z.string().max(100), status: z.enum(['draft', 'scheduled']), scheduledAt: date.nullable().optional() }).strict() },
  schedules: { model: 'reportSchedule', permission: 'reports', search: ['name'], schema: z.object({ name: title, type: z.enum(['users', 'productivity', 'usage', 'subscriptions', 'revenue']), frequency: z.enum(['daily', 'weekly', 'monthly']), enabled: z.boolean(), nextRunAt: date }).strict() },
} as const;
export type Resource = keyof typeof resourceConfig;
export function resourcePermission(resource: Resource, write = false) { return `${resourceConfig[resource].permission}.${write ? 'write' : 'read'}` as Permission; }
export function isResource(value: string): value is Resource { return Object.hasOwn(resourceConfig, value); }
