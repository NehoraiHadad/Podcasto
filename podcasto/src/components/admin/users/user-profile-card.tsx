'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UserDetailsData } from '@/lib/actions/admin/user-actions';
import { Mail, User, Clock, Calendar, Bell, BellOff, Shield } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface UserProfileCardProps {
  user: Pick<
    UserDetailsData,
    'email' | 'displayName' | 'role' | 'emailNotifications' | 'createdAt' | 'lastSignInAt'
  >;
}

export function UserProfileCard({ user }: UserProfileCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          User Profile
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-3">
          <div className="flex items-start gap-3">
            <Mail className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-muted-foreground">Email</p>
              <p className="text-sm break-all">{user.email}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <User className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-muted-foreground">Display Name</p>
              <p className="text-sm">{user.displayName || 'Not set'}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Shield className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-muted-foreground">Role</p>
              <Badge variant={user.role === 'admin' ? 'default' : 'secondary'} className="mt-1">
                {user.role}
              </Badge>
            </div>
          </div>

          <div className="flex items-start gap-3">
            {user.emailNotifications ? (
              <Bell className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            ) : (
              <BellOff className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-muted-foreground">Email Notifications</p>
              <p className="text-sm">{user.emailNotifications ? 'Enabled' : 'Disabled'}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Calendar className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-muted-foreground">Joined</p>
              <p className="text-sm">
                {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Clock className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-muted-foreground">Last Login</p>
              <p className="text-sm">
                {user.lastSignInAt
                  ? formatDistanceToNow(new Date(user.lastSignInAt), { addSuffix: true })
                  : 'Never'}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
