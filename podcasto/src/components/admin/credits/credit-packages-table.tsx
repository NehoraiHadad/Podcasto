'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CreditPackageRecord } from '@/lib/db/api/credits/credit-packages-api';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { MoreHorizontal, Edit, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { toast } from 'sonner';
import {
  deleteCreditPackageAction,
  toggleCreditPackageStatusAction,
} from '@/lib/actions/credit';

interface CreditPackagesTableProps {
  packages: CreditPackageRecord[];
}

export function CreditPackagesTable({ packages }: CreditPackagesTableProps) {
  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [packageToDelete, setPackageToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleToggleStatus = async (packageId: string) => {
    try {
      const result = await toggleCreditPackageStatusAction(packageId);

      if (result.success) {
        toast.success('Package status updated');
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to update package status');
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
      console.error(error);
    }
  };

  const handleDeleteClick = (packageId: string) => {
    setPackageToDelete(packageId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!packageToDelete) return;

    setIsDeleting(true);
    try {
      const result = await deleteCreditPackageAction(packageToDelete);

      if (result.success) {
        toast.success('Package deleted successfully');
        router.refresh();
        setDeleteDialogOpen(false);
      } else {
        toast.error(result.error || 'Failed to delete package');
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
      console.error(error);
    } finally {
      setIsDeleting(false);
      setPackageToDelete(null);
    }
  };

  if (packages.length === 0) {
    return (
      <div className="text-center py-8 border rounded-md">
        <p className="text-muted-foreground">No credit packages found</p>
        <p className="text-sm text-muted-foreground mt-2">Create your first package to get started</p>
      </div>
    );
  }

  return (
    <>
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Credits</TableHead>
              <TableHead>Price (USD)</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Display Order</TableHead>
              <TableHead>Validity</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {packages.map((pkg) => (
              <TableRow key={pkg.id}>
                <TableCell className="font-medium">
                  <div>
                    <div>{pkg.name}</div>
                    {pkg.description && (
                      <div className="text-sm text-muted-foreground">{pkg.description}</div>
                    )}
                  </div>
                </TableCell>
                <TableCell>{parseFloat(pkg.credits_amount).toLocaleString()}</TableCell>
                <TableCell>${parseFloat(pkg.price_usd).toFixed(2)}</TableCell>
                <TableCell>
                  <Badge variant={pkg.is_active ? 'default' : 'secondary'}>
                    {pkg.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell>{pkg.display_order}</TableCell>
                <TableCell>
                  {pkg.validity_days ? `${pkg.validity_days} days` : 'No expiration'}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Actions</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => router.push(`/admin/credits/packages/${pkg.id}/edit`)}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleToggleStatus(pkg.id)}>
                        {pkg.is_active ? (
                          <>
                            <ToggleLeft className="h-4 w-4 mr-2" />
                            Deactivate
                          </>
                        ) : (
                          <>
                            <ToggleRight className="h-4 w-4 mr-2" />
                            Activate
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleDeleteClick(pkg.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Credit Package</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this credit package? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
