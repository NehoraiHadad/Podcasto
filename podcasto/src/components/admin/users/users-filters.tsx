'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search } from 'lucide-react';

export function UsersFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [role, setRole] = useState(searchParams.get('role') || 'all');
  const [emailStatus, setEmailStatus] = useState(searchParams.get('emailStatus') || 'all');

  const updateFilters = (newSearch: string, newRole: string, newEmailStatus: string) => {
    const params = new URLSearchParams();

    if (newSearch) params.set('search', newSearch);
    if (newRole && newRole !== 'all') params.set('role', newRole);
    if (newEmailStatus && newEmailStatus !== 'all') params.set('emailStatus', newEmailStatus);

    // Reset to page 1 when filters change
    params.set('page', '1');

    router.push(`/admin/users?${params.toString()}`);
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    // Debounce search
    const timeoutId = setTimeout(() => {
      updateFilters(value, role, emailStatus);
    }, 500);

    return () => clearTimeout(timeoutId);
  };

  const handleRoleChange = (value: string) => {
    setRole(value);
    updateFilters(search, value, emailStatus);
  };

  const handleEmailStatusChange = (value: string) => {
    setEmailStatus(value);
    updateFilters(search, role, value);
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by email or name..."
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      <Select value={role} onValueChange={handleRoleChange}>
        <SelectTrigger className="w-full sm:w-[180px]">
          <SelectValue placeholder="Filter by role" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Roles</SelectItem>
          <SelectItem value="admin">Admin</SelectItem>
          <SelectItem value="user">User</SelectItem>
        </SelectContent>
      </Select>

      <Select value={emailStatus} onValueChange={handleEmailStatusChange}>
        <SelectTrigger className="w-full sm:w-[180px]">
          <SelectValue placeholder="Email status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="bounced">Bounced</SelectItem>
          <SelectItem value="complained">Complained</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
