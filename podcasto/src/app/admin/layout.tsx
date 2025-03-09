import { verifyAdminAccess } from '@/lib/utils/admin-utils';
import { AdminSidebar } from '@/components/admin/admin-sidebar';
import { AdminErrorBoundary } from '@/components/admin/error-boundary';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Use the verifyAdminAccess utility to check if the user is an admin
  // This will automatically redirect to unauthorized page if not
  await verifyAdminAccess();
  
  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
      <div className="flex-1 overflow-auto">
        <AdminErrorBoundary>
          <main className="p-6">{children}</main>
        </AdminErrorBoundary>
      </div>
    </div>
  );
} 