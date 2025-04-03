import { verifyAdminAccess } from '@/lib/utils/admin-utils';
import { AdminSidebar } from '@/components/admin/admin-sidebar';
import { AdminErrorBoundary } from '@/components/admin/error-boundary';
import { SidebarContentWrapper } from '@/components/admin/admin-sidebar/content-wrapper';
import { SidebarProvider } from '@/components/admin/admin-sidebar';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Use the verifyAdminAccess utility to check if the user is an admin
  // This will automatically redirect to unauthorized page if not
  await verifyAdminAccess();
  
  return (
    <SidebarProvider>
      <div className="min-h-screen bg-gray-50">
        <AdminSidebar />
        <SidebarContentWrapper>
          <AdminErrorBoundary>
            <main className="p-4 md:p-6">{children}</main>
          </AdminErrorBoundary>
        </SidebarContentWrapper>
      </div>
    </SidebarProvider>
  );
} 