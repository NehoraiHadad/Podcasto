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
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">No recent activity</p>
          </div>
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
