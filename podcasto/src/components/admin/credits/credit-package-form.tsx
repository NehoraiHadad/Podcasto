'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { createCreditPackageAction, updateCreditPackageAction } from '@/lib/actions/credit';
import { CreditPackageRecord } from '@/lib/db/api/credits/credit-packages-api';
import { Loader2 } from 'lucide-react';

const packageFormSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  credits_amount: z.string().refine((val) => {
    const num = parseFloat(val);
    return !isNaN(num) && num > 0;
  }, 'Credits amount must be a positive number'),
  price_usd: z.string().refine((val) => {
    const num = parseFloat(val);
    return !isNaN(num) && num > 0;
  }, 'Price must be a positive number'),
  description: z.string().optional(),
  display_order: z.string().refine((val) => {
    const num = parseInt(val);
    return !isNaN(num) && num >= 0;
  }, 'Display order must be a non-negative integer'),
  is_active: z.boolean().default(true),
  validity_days: z.string().optional(),
});

type PackageFormValues = z.infer<typeof packageFormSchema>;

interface CreditPackageFormProps {
  package?: CreditPackageRecord;
}

export function CreditPackageForm({ package: pkg }: CreditPackageFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!pkg;

  const form = useForm<PackageFormValues>({
    resolver: zodResolver(packageFormSchema),
    defaultValues: {
      name: pkg?.name || '',
      credits_amount: pkg?.credits_amount || '',
      price_usd: pkg?.price_usd || '',
      description: pkg?.description || '',
      display_order: pkg?.display_order?.toString() || '0',
      is_active: pkg?.is_active ?? true,
      validity_days: pkg?.validity_days?.toString() || '',
    },
  });

  const onSubmit = async (data: PackageFormValues) => {
    setIsSubmitting(true);

    try {
      const packageData = {
        name: data.name,
        credits_amount: data.credits_amount,
        price_usd: parseFloat(data.price_usd).toFixed(2),
        description: data.description || undefined,
        display_order: parseInt(data.display_order),
        is_active: data.is_active,
        validity_days: data.validity_days ? parseInt(data.validity_days) : undefined,
      };

      const result = isEditing
        ? await updateCreditPackageAction(pkg.id, packageData)
        : await createCreditPackageAction(packageData);

      if (result.success) {
        toast.success(
          isEditing
            ? 'Credit package updated successfully'
            : 'Credit package created successfully'
        );
        router.push('/admin/credits');
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to save credit package');
      }
    } catch (error) {
      console.error('Form submission error:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? 'Edit Package' : 'New Package'}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Package Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Basic, Pro, Enterprise" {...field} />
                  </FormControl>
                  <FormDescription>
                    The display name for this credit package
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="credits_amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Credits Amount</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="100" {...field} />
                    </FormControl>
                    <FormDescription>Number of credits in package</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="price_usd"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price (USD)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="9.99" {...field} />
                    </FormControl>
                    <FormDescription>Price in US dollars</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe this package..."
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Additional details about this package
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="display_order"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Display Order</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0" {...field} />
                    </FormControl>
                    <FormDescription>
                      Lower numbers appear first
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="validity_days"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Validity Days (Optional)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="Leave empty for no expiration" {...field} />
                    </FormControl>
                    <FormDescription>
                      Days until credits expire
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Active</FormLabel>
                    <FormDescription>
                      Make this package available for purchase
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex gap-4">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? 'Update Package' : 'Create Package'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/admin/credits')}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
