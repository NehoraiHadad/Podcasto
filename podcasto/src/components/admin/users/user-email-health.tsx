'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { UserDetailsData } from '@/lib/actions/admin/user-actions';
import { Mail, AlertTriangle, XCircle, CheckCircle, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface UserEmailHealthProps {
  emailHealth: UserDetailsData['emailHealth'];
}

export function UserEmailHealth({ emailHealth }: UserEmailHealthProps) {
  const { status, bouncesCount, complaintsCount, lastEmailSent } = emailHealth;

  const statusConfig = {
    active: {
      icon: CheckCircle,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-100 dark:bg-green-900/20',
      label: 'Active',
      variant: 'default' as const,
    },
    bounced: {
      icon: AlertTriangle,
      color: 'text-yellow-600 dark:text-yellow-400',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/20',
      label: 'Bounced',
      variant: 'destructive' as const,
    },
    complained: {
      icon: XCircle,
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-100 dark:bg-red-900/20',
      label: 'Complained',
      variant: 'destructive' as const,
    },
  };

  const config = statusConfig[status];
  const StatusIcon = config.icon;
  const hasIssues = bouncesCount > 0 || complaintsCount > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Email Health
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <div className={`rounded-full p-2 ${config.bgColor}`}>
            <StatusIcon className={`h-5 w-5 ${config.color}`} />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Status</p>
            <Badge variant={config.variant}>{config.label}</Badge>
          </div>
        </div>

        {hasIssues && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Email Issues Detected</AlertTitle>
            <AlertDescription className="space-y-1 text-sm">
              {bouncesCount > 0 && <p>Bounces: {bouncesCount}</p>}
              {complaintsCount > 0 && <p>Complaints: {complaintsCount}</p>}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium text-muted-foreground">Bounces</p>
            <p className="text-2xl font-bold">{bouncesCount}</p>
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium text-muted-foreground">Complaints</p>
            <p className="text-2xl font-bold">{complaintsCount}</p>
          </div>
        </div>

        <div className="flex items-start gap-3 pt-2 border-t">
          <Clock className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-muted-foreground">Last Email Sent</p>
            <p className="text-sm">
              {lastEmailSent
                ? formatDistanceToNow(new Date(lastEmailSent), { addSuffix: true })
                : 'Never'}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
