'use client';

import { useState, useTransition } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { updateEmailNotificationPreference } from '@/lib/actions/subscription-actions';

interface NotificationSettingsFormProps {
  initialEnabled: boolean;
  userEmail: string;
}

export function NotificationSettingsForm({
  initialEnabled,
  userEmail
}: NotificationSettingsFormProps) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [isPending, startTransition] = useTransition();

  const handleToggle = async (checked: boolean) => {
    setEnabled(checked);

    startTransition(async () => {
      const result = await updateEmailNotificationPreference();

      if (result.success) {
        toast.success(
          checked
            ? 'Email notifications enabled'
            : 'Email notifications disabled'
        );
      } else {
        setEnabled(!checked); // Revert on error
        toast.error(result.message || 'Failed to update settings');
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>New Episode Notifications</CardTitle>
        <CardDescription>
          Receive email notifications when new episodes are published from podcasts you subscribe to
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="email-notifications" className="flex flex-col space-y-1">
            <span>Email notifications</span>
            <span className="font-normal text-sm text-muted-foreground">
              {userEmail}
            </span>
          </Label>
          <Switch
            id="email-notifications"
            checked={enabled}
            onCheckedChange={handleToggle}
            disabled={isPending}
          />
        </div>
      </CardContent>
    </Card>
  );
}
