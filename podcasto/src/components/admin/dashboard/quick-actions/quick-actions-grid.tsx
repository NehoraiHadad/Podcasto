import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ActionButton } from './action-button';
import { Plus, ListPlus, Users, Settings, Play, BarChart } from 'lucide-react';

export function QuickActionsGrid() {
  const actions = [
    {
      href: '/admin/podcasts/create',
      icon: Plus,
      label: 'Create Podcast',
      description: 'Create a new podcast',
      variant: 'default' as const
    },
    {
      href: '/admin/podcasts/generate',
      icon: ListPlus,
      label: 'Generate Episodes',
      description: 'Bulk episode generation',
      variant: 'outline' as const
    },
    {
      href: '/admin/episodes',
      icon: Play,
      label: 'Manage Episodes',
      description: 'View all episodes',
      variant: 'outline' as const
    },
    {
      href: '/admin/users',
      icon: Users,
      label: 'Manage Users',
      description: 'User administration',
      variant: 'outline' as const
    },
    {
      href: '/admin/podcasts',
      icon: BarChart,
      label: 'View Analytics',
      description: 'Podcast statistics',
      variant: 'outline' as const
    },
    {
      href: '/admin/settings',
      icon: Settings,
      label: 'Settings',
      description: 'System configuration',
      variant: 'outline' as const
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {actions.map((action) => (
            <ActionButton key={action.href} {...action} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
