'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, User, Loader2 } from 'lucide-react';
import { updateUserRoleAction } from '@/lib/actions/admin/user-actions';
import { toast } from 'sonner';

interface UserRoleManagerProps {
  userId: string;
  currentRole: string;
  userEmail: string;
}

export function UserRoleManager({ userId, currentRole, userEmail }: UserRoleManagerProps) {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<'admin' | 'user'>(
    currentRole === 'admin' ? 'admin' : 'user'
  );
  const [isLoading, setIsLoading] = useState(false);

  const handleRoleChange = async () => {
    if (selectedRole === currentRole) {
      toast.info('No changes to save');
      return;
    }

    setIsLoading(true);

    try {
      const result = await updateUserRoleAction(userId, selectedRole);

      if (result.success) {
        toast.success(`Role updated to ${selectedRole}`);
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to update role');
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
      console.error('Error updating role:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const hasChanges = selectedRole !== currentRole;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          User Role Management
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Current Role</p>
            <div className="mt-1">
              {currentRole === 'admin' ? (
                <Badge variant="default" className="bg-purple-600">
                  <Shield className="h-3 w-3 mr-1" />
                  Admin
                </Badge>
              ) : (
                <Badge variant="outline">
                  <User className="h-3 w-3 mr-1" />
                  User
                </Badge>
              )}
            </div>
          </div>

          <div className="flex-1 max-w-xs ml-4">
            <p className="text-sm font-medium mb-2">Change Role</p>
            <Select
              value={selectedRole}
              onValueChange={(value) => setSelectedRole(value as 'admin' | 'user')}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    User
                  </div>
                </SelectItem>
                <SelectItem value="admin">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Admin
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {hasChanges && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
            <p className="text-sm text-amber-800">
              You are about to change {userEmail}&apos;s role from{' '}
              <strong>{currentRole}</strong> to <strong>{selectedRole}</strong>.
            </p>
          </div>
        )}

        <div className="flex gap-2">
          <Button
            onClick={handleRoleChange}
            disabled={!hasChanges || isLoading}
            className="flex-1"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
          {hasChanges && (
            <Button
              variant="outline"
              onClick={() => setSelectedRole(currentRole === 'admin' ? 'admin' : 'user')}
              disabled={isLoading}
            >
              Cancel
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
