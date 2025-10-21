'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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

interface GrantCreditsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  onSuccess?: () => void;
}

export function GrantCreditsDialog({
  open,
  onOpenChange,
  userId,
  onSuccess,
}: GrantCreditsDialogProps) {
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
        onSuccess?.();
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

  const handleClose = () => {
    if (!isSubmitting) {
      form.reset();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Grant Bonus Credits</DialogTitle>
          <DialogDescription>
            Add bonus credits to this user's account. This will be marked as a free credit transaction.
          </DialogDescription>
        </DialogHeader>

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
                      placeholder="e.g., Compensation for service issue, promotional bonus..."
                      rows={3}
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Grant Credits
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
