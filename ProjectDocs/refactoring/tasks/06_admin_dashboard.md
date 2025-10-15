# Admin Dashboard Redesign - Task 6.5

**Created:** 2025-10-15
**Status:** Planning
**Priority:** Medium

---

## Current State Analysis

### Existing Dashboard (`src/app/admin/page.tsx`)

**Structure:**
- Simple layout with ServerAdminDashboard + CronRunner
- 50 lines total (page file)

**ServerAdminDashboard Component (`src/components/admin/server-admin-dashboard.tsx`):**
- 103 lines
- **Statistics:** 3 basic stat cards (Podcasts, Episodes, Users)
- **Quick Actions:** 2 action buttons (Create Podcast, Generate Episodes)
- Server component with proper noStore()
- Error handling included

### Current Statistics Displayed

1. **Total Podcasts** - Simple count
2. **Total Episodes** - Simple count
3. **Total Users** - Simple count

### Problems Identified

1. **Limited statistics** - Only 3 basic counts
2. **No visual hierarchy** - All stats look the same importance
3. **Missing recent activity** - No feed of recent changes
4. **No status indicators** - Can't see failed/pending episodes at a glance
5. **No trends** - No indication of growth or changes over time
6. **Basic quick actions** - Only 2 actions, could have more
7. **No system health** - No indicators for cron jobs, queue status, etc.

---

## Goals

### Primary Objectives

1. **Enhanced Statistics** - Add more meaningful metrics
2. **Recent Activity Feed** - Show latest episodes, podcasts, actions
3. **Visual Improvements** - Better icons, colors, layout
4. **System Health Indicators** - Show cron job status, queue health
5. **Status Breakdown** - Show episodes by status (pending, processing, published, failed)

### Success Criteria

✅ More comprehensive statistics (8+ metrics)
✅ Recent activity feed showing last 10 actions
✅ Visual improvements with icons and colors
✅ Status breakdown for episodes
✅ Quick actions expanded to 6+ items
✅ All components < 150 lines
✅ Build passing
✅ Server component architecture maintained

---

## Implementation Plan

### Phase 1: Enhanced Statistics (30 minutes)

Create new statistics components:

```
src/components/admin/dashboard/
├── statistics/
│   ├── stat-card.tsx                 # Reusable stat card (NO 'use client')
│   ├── status-breakdown-card.tsx     # Episode status breakdown (NO 'use client')
│   └── index.ts                      # Exports
```

**stat-card.tsx** (Presentational, <50 lines):
```tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: number | string;
  description: string;
  icon: LucideIcon;
  iconColor?: string;
  trend?: {
    value: number;
    label: string;
  };
}

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  iconColor = 'text-gray-500',
  trend
}: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${iconColor}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
        {trend && (
          <p className="text-xs text-muted-foreground mt-1">
            <span className={trend.value > 0 ? 'text-green-600' : 'text-red-600'}>
              {trend.value > 0 ? '+' : ''}{trend.value}
            </span>
            {' '}{trend.label}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
```

**status-breakdown-card.tsx** (Presentational, <80 lines):
```tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface StatusBreakdown {
  pending: number;
  processing: number;
  published: number;
  failed: number;
}

interface StatusBreakdownCardProps {
  statusBreakdown: StatusBreakdown;
}

export function StatusBreakdownCard({ statusBreakdown }: StatusBreakdownCardProps) {
  const statuses = [
    { label: 'Published', count: statusBreakdown.published, color: 'bg-green-100 text-green-800' },
    { label: 'Processing', count: statusBreakdown.processing, color: 'bg-blue-100 text-blue-800' },
    { label: 'Pending', count: statusBreakdown.pending, color: 'bg-yellow-100 text-yellow-800' },
    { label: 'Failed', count: statusBreakdown.failed, color: 'bg-red-100 text-red-800' }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Episode Status</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {statuses.map((status) => (
            <div key={status.label} className="flex items-center justify-between">
              <Badge className={status.color}>{status.label}</Badge>
              <span className="text-2xl font-bold">{status.count}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
```

### Phase 2: Recent Activity Feed (30 minutes)

Create activity feed components:

```
src/components/admin/dashboard/
├── activity/
│   ├── activity-feed.tsx           # Activity feed list (NO 'use client')
│   ├── activity-item.tsx           # Single activity item (NO 'use client')
│   └── index.ts                    # Exports
```

**activity-feed.tsx** (<100 lines):
```tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ActivityItem } from './activity-item';

export interface Activity {
  id: string;
  type: 'podcast_created' | 'episode_generated' | 'episode_published' | 'episode_failed';
  title: string;
  description: string;
  timestamp: string;
  metadata?: {
    podcastTitle?: string;
    episodeTitle?: string;
  };
}

interface ActivityFeedProps {
  activities: Activity[];
}

export function ActivityFeed({ activities }: ActivityFeedProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <p className="text-sm text-muted-foreground">No recent activity</p>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => (
              <ActivityItem key={activity.id} activity={activity} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

**activity-item.tsx** (<60 lines):
```tsx
import { CheckCircle, AlertCircle, FileAudio, Radio } from 'lucide-react';
import { Activity } from './activity-feed';

interface ActivityItemProps {
  activity: Activity;
}

export function ActivityItem({ activity }: ActivityItemProps) {
  const getIcon = () => {
    switch (activity.type) {
      case 'podcast_created':
        return <Radio className="h-4 w-4 text-blue-500" />;
      case 'episode_generated':
        return <FileAudio className="h-4 w-4 text-purple-500" />;
      case 'episode_published':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'episode_failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="flex items-start space-x-3">
      <div className="mt-0.5">{getIcon()}</div>
      <div className="flex-1 space-y-1">
        <p className="text-sm font-medium">{activity.title}</p>
        <p className="text-xs text-muted-foreground">{activity.description}</p>
        <p className="text-xs text-muted-foreground">{activity.timestamp}</p>
      </div>
    </div>
  );
}
```

### Phase 3: Quick Actions Enhancement (20 minutes)

Create enhanced quick actions:

```
src/components/admin/dashboard/
├── quick-actions/
│   ├── quick-actions-grid.tsx      # Actions grid (NO 'use client')
│   ├── action-button.tsx           # Single action button (NO 'use client')
│   └── index.ts                    # Exports
```

**quick-actions-grid.tsx** (<80 lines):
```tsx
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
```

### Phase 4: Update Server Actions (20 minutes)

Update `getAdminDashboardStats` in `src/lib/actions/admin-actions.ts` to return enhanced statistics:

```tsx
export async function getAdminDashboardStats() {
  const user = await getCurrentUser();

  if (!user || !await verifyAdminRole(user.id)) {
    throw new Error('Unauthorized');
  }

  const db = await getDb();

  // Get basic counts
  const [podcasts, episodes, users] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(podcastsTable),
    db.select({ count: sql<number>`count(*)` }).from(episodesTable),
    db.select({ count: sql<number>`count(*)` }).from(profilesTable)
  ]);

  // Get episode status breakdown
  const statusBreakdown = await db
    .select({
      status: episodesTable.status,
      count: sql<number>`count(*)`
    })
    .from(episodesTable)
    .groupBy(episodesTable.status);

  // Get active podcasts count (not paused)
  const activePodcasts = await db
    .select({ count: sql<number>`count(*)` })
    .from(podcastsTable)
    .where(eq(podcastsTable.isPaused, false));

  // Get recent activity (last 10 episodes)
  const recentEpisodes = await db
    .select({
      id: episodesTable.id,
      title: episodesTable.title,
      status: episodesTable.status,
      createdAt: episodesTable.createdAt,
      podcastId: episodesTable.podcastId,
      podcastTitle: podcastsTable.title
    })
    .from(episodesTable)
    .leftJoin(podcastsTable, eq(episodesTable.podcastId, podcastsTable.id))
    .orderBy(desc(episodesTable.createdAt))
    .limit(10);

  return {
    totalPodcasts: podcasts[0]?.count || 0,
    totalEpisodes: episodes[0]?.count || 0,
    totalUsers: users[0]?.count || 0,
    activePodcasts: activePodcasts[0]?.count || 0,
    statusBreakdown: {
      pending: statusBreakdown.find(s => s.status === 'pending')?.count || 0,
      processing: statusBreakdown.find(s => s.status === 'processing')?.count || 0,
      published: statusBreakdown.find(s => s.status === 'published')?.count || 0,
      failed: statusBreakdown.find(s => s.status === 'failed')?.count || 0
    },
    recentActivity: recentEpisodes.map(episode => ({
      id: episode.id,
      type: episode.status === 'published' ? 'episode_published' :
            episode.status === 'failed' ? 'episode_failed' : 'episode_generated',
      title: episode.title,
      description: `Podcast: ${episode.podcastTitle}`,
      timestamp: new Date(episode.createdAt!).toLocaleString(),
      metadata: {
        podcastTitle: episode.podcastTitle || undefined,
        episodeTitle: episode.title
      }
    }))
  };
}
```

### Phase 5: Refactor ServerAdminDashboard (30 minutes)

Update `src/components/admin/server-admin-dashboard.tsx` to use new components:

**Target:** <150 lines (from 103 lines)

```tsx
import Link from 'next/link';
import { unstable_noStore as noStore } from 'next/cache';
import { getAdminDashboardStats } from '@/lib/actions/admin-actions';
import { verifyAdminAccess } from '@/lib/utils/admin-utils';
import {
  Podcast,
  FileAudio,
  Users,
  Radio,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

// Import new dashboard components
import { StatCard } from './dashboard/statistics/stat-card';
import { StatusBreakdownCard } from './dashboard/statistics/status-breakdown-card';
import { ActivityFeed } from './dashboard/activity/activity-feed';
import { QuickActionsGrid } from './dashboard/quick-actions/quick-actions-grid';

export async function ServerAdminDashboard() {
  noStore();
  await verifyAdminAccess();

  try {
    const stats = await getAdminDashboardStats();

    return (
      <div className="space-y-6">
        {/* Statistics Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Podcasts"
            value={stats.totalPodcasts}
            description="All podcasts"
            icon={Podcast}
            iconColor="text-blue-500"
          />
          <StatCard
            title="Active Podcasts"
            value={stats.activePodcasts}
            description="Currently active"
            icon={Radio}
            iconColor="text-green-500"
          />
          <StatCard
            title="Total Episodes"
            value={stats.totalEpisodes}
            description="All episodes"
            icon={FileAudio}
            iconColor="text-purple-500"
          />
          <StatCard
            title="Total Users"
            value={stats.totalUsers}
            description="Registered users"
            icon={Users}
            iconColor="text-orange-500"
          />
        </div>

        {/* Second Row: Status Breakdown + Quick Actions */}
        <div className="grid gap-4 md:grid-cols-2">
          <StatusBreakdownCard statusBreakdown={stats.statusBreakdown} />
          <QuickActionsGrid />
        </div>

        {/* Recent Activity */}
        <ActivityFeed activities={stats.recentActivity} />
      </div>
    );
  } catch (error) {
    console.error('Error in ServerAdminDashboard:', error);
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md">
        <h3 className="text-lg font-semibold text-red-800">Error</h3>
        <p className="text-red-600">Failed to load dashboard data.</p>
      </div>
    );
  }
}
```

### Phase 6: Create Index Files (5 minutes)

Create index.ts files for clean imports:

```
src/components/admin/dashboard/index.ts
src/components/admin/dashboard/statistics/index.ts
src/components/admin/dashboard/activity/index.ts
src/components/admin/dashboard/quick-actions/index.ts
```

### Phase 7: Build Verification (5 minutes)

```bash
npm run build
```

Build MUST pass with no errors.

---

## File Structure

```
src/
├── components/admin/
│   ├── dashboard/
│   │   ├── statistics/
│   │   │   ├── stat-card.tsx               (~50 lines, NO 'use client')
│   │   │   ├── status-breakdown-card.tsx   (~80 lines, NO 'use client')
│   │   │   └── index.ts
│   │   ├── activity/
│   │   │   ├── activity-feed.tsx           (~100 lines, NO 'use client')
│   │   │   ├── activity-item.tsx           (~60 lines, NO 'use client')
│   │   │   └── index.ts
│   │   ├── quick-actions/
│   │   │   ├── quick-actions-grid.tsx      (~80 lines, NO 'use client')
│   │   │   ├── action-button.tsx           (~40 lines, NO 'use client')
│   │   │   └── index.ts
│   │   └── index.ts
│   └── server-admin-dashboard.tsx          (~150 lines, NO 'use client')
├── lib/actions/
│   └── admin-actions.ts                    (update getAdminDashboardStats)
```

**Total new files:** 11 files (~610 lines)
**Files modified:** 2 files (server-admin-dashboard.tsx, admin-actions.ts)

---

## Technical Requirements

### 'use client' Directive Usage

**NO 'use client' needed:**
- ❌ All dashboard components (Server Components)
- ❌ stat-card.tsx (presentational)
- ❌ status-breakdown-card.tsx (presentational)
- ❌ activity-feed.tsx (presentational)
- ❌ activity-item.tsx (presentational)
- ❌ quick-actions-grid.tsx (presentational)
- ❌ action-button.tsx (presentational)
- ❌ server-admin-dashboard.tsx (Server Component)

**Why No 'use client'?**
- All components are purely presentational
- No client-side state management needed
- No client-side interactivity (only links)
- Server Component architecture for better performance

### File Size Limits

- All files < 150 lines
- Target: Most files < 100 lines
- Presentational components < 80 lines

### Code Quality

- TypeScript strict mode
- Proper interfaces for all props
- Consistent icon usage from lucide-react
- Shadcn/ui components for UI
- Responsive design (grid layouts adapt to screen size)

---

## Success Criteria

✅ 11 new files created (~610 lines)
✅ 2 files updated (server-admin-dashboard, admin-actions)
✅ Enhanced statistics (8 metrics instead of 3)
✅ Recent activity feed showing last 10 actions
✅ Visual improvements with icons and colors
✅ Status breakdown for episodes
✅ Quick actions expanded to 6 items
✅ All files < 150 lines
✅ All components are Server Components (NO 'use client')
✅ Build passes with no errors
✅ Responsive design

---

## Expected Outcome

### Before
- 3 basic stat cards (Podcasts, Episodes, Users)
- 2 quick action buttons
- 103 lines in server-admin-dashboard.tsx
- Basic layout, no visual hierarchy

### After
- 8 comprehensive statistics with icons and colors
- Episode status breakdown with badge indicators
- Recent activity feed (last 10 actions)
- 6 quick action buttons with icons
- ~150 lines in server-admin-dashboard.tsx
- Professional dashboard with clear visual hierarchy
- Better organization with modular components

### Code Metrics
- Files created: 11 files (~610 lines)
- Files modified: 2 files
- Total dashboard code: ~760 lines (well-organized)
- All components < 150 lines
- 100% Server Components (better performance)

---

**Status:** Ready for implementation
**Next Step:** Launch senior-frontend-dev subagent with detailed requirements
