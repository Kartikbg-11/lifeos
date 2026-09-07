export const PERMISSIONS = [
  'dashboard.read', 'users.read', 'users.write', 'users.delete', 'analytics.read',
  'activity.read', 'productivity.read', 'billing.read', 'billing.write',
  'reports.read', 'reports.write', 'content.read', 'content.write',
  'feedback.read', 'feedback.write', 'support.read', 'support.write',
  'notifications.read', 'notifications.write', 'audit.read', 'settings.read', 'settings.write',
] as const;
export type Permission = typeof PERMISSIONS[number];
export function can(permissions: readonly string[], permission: Permission) {
  return permissions.includes('*') || permissions.includes(permission);
}

export type AdminIdentity = { id: string; name: string | null; email: string; roleId: string; roleName: string; permissions: string[]; datePreferences?: { timezone: string; dateFormat: string } };
