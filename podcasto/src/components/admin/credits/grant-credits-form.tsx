'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { grantCreditsToUserAction } from '@/lib/actions/credit';
import { Loader2 } from 'lucide-react';

const grantCreditsSchema = z.object({
  amount: z.string().refine((val) => {
    const num = parseFloat(val);
    return !isNaN(num) && num > 0;
  }, 'Amount must be a positive number'),
  description: z.string().min(1, 'Description is required'),
});

type GrantCreditsFormValues = z.infer<typeof grantCreditsSchema>;

interface GrantCreditsFormProps {
  userId: string;
}

export function GrantCreditsForm({ userId }: GrantCreditsFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<GrantCreditsFormValues>({
    resolver: zodResolver(grantCreditsSchema),
    defaultValues: {
      amount: '',
      description: '',
    },
  });

  const onSubmit = async (data: GrantCreditsFormValues) => {
    setIsSubmitting(true);

    try {
      const amount = parseFloat(data.amount);
      const result = await grantCreditsToUserAction(userId, amount, data.description);

      if (result.success) {
        toast.success(`Successfully granted ${amount} credits`);
        form.reset();
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to grant credits');
      }
    } catch (error) {
      console.error('Grant credits error:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Credit Amount</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="100"
                  {...field}
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Reason</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="e.g., Compensation for service issue..."
                  rows={3}
                  {...field}
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Grant Credits
        </Button>
      </form>
    </Form>
  );
}
