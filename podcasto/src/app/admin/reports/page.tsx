import { Metadata } from 'next';
import { checkIsAdmin } from '@/lib/actions/admin/auth-actions';
import { GenerationReportsPage } from '@/components/admin/reports/generation-reports-page';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Generation Reports | Podcasto Admin',
  description: 'View episode generation reports and analytics',
};

export default async function ReportsPage() {
  await checkIsAdmin({ redirectOnFailure: true });

  return <GenerationReportsPage />;
}
