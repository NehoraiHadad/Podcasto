import { checkIsAdmin } from '@/lib/actions/admin/auth-actions';
import { CreditPackageForm } from '@/components/admin/credits/credit-package-form';

export const metadata = {
  title: 'Create Credit Package | Admin Dashboard | Podcasto',
  description: 'Create a new credit package',
};

export default async function CreateCreditPackagePage() {
  await checkIsAdmin({ redirectOnFailure: true });

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Create Credit Package</h1>
        <p className="text-muted-foreground mt-2">
          Define a new credit package for users to purchase
        </p>
      </div>

      <CreditPackageForm />
    </div>
  );
}
