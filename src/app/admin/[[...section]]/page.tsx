import { AdminWorkspace } from '@/components/admin/admin-workspace';
export default async function AdminPage({ params }: { params: Promise<{ section?: string[] }> }) {
  const { section = [] } = await params;
  return <AdminWorkspace section={section[0] || ''} recordId={section[1]} />;
}
