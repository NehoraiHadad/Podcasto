import { checkIsAdmin } from '@/lib/actions/admin/auth-actions';
import { getCreditPackageById } from '@/lib/db/api/credits/credit-packages-api';
import { CreditPackageForm } from '@/components/admin/credits/credit-package-form';
import { notFound } from 'next/navigation';

export const metadata = {
  title: 'Edit Credit Package | Admin Dashboard | Podcasto',
  description: 'Edit credit package details',
};

export default async function EditCreditPackagePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await checkIsAdmin({ redirectOnFailure: true });

  const { id } = await params;
  const pkg = await getCreditPackageById(id);

  if (!pkg) {
    notFound();
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Edit Credit Package</h1>
        <p className="text-muted-foreground mt-2">
          Update the details of {pkg.name}
        </p>
      </div>

      <CreditPackageForm package={pkg} />
    </div>
  );
}
