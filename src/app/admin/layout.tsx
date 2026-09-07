import { redirect } from 'next/navigation';
import Link from 'next/link';
import { requireAdmin, AdminError } from '@/lib/admin/server';
import { AdminShell } from '@/components/admin/admin-shell';
import { db } from '@/lib/db';
import './admin.css';

export const metadata = { title: 'Admin Console · LIFEOS', robots: { index: false, follow: false } };
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  let actor;
  try { actor = await requireAdmin(); } catch (error) {
    if (error instanceof AdminError && error.status === 401) redirect('/login');
    if (error instanceof AdminError && error.status === 403) return <div className="ad-access-denied"><span>ADMIN CONSOLE</span><h1>This workspace is for administrators.</h1><p>Your LIFEOS account is signed in, but does not have admin access.</p><Link href="/">Return to your dashboard →</Link></div>;
    throw error;
  }
  const branding = await db.adminSettings.findUnique({ where: { id: 'app' }, select: { appName: true, logoUrl: true, timezone: true, dateFormat: true } });
  return <AdminShell actor={actor} branding={branding || { appName: 'LIFEOS', logoUrl: '', timezone: 'Asia/Kolkata', dateFormat: 'dd MMM yyyy' }}>{children}</AdminShell>;
}
