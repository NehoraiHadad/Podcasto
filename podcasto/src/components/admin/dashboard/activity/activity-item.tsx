import { CheckCircle, AlertCircle, FileAudio, Radio } from 'lucide-react';
import type { Activity } from './activity-feed';

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
    <div className="flex items-start space-x-3 pb-3 border-b last:border-0 last:pb-0">
      <div className="mt-0.5">{getIcon()}</div>
      <div className="flex-1 space-y-1 min-w-0">
        <p className="text-sm font-medium leading-none truncate">{activity.title}</p>
        <p className="text-xs text-muted-foreground truncate">{activity.description}</p>
        <p className="text-xs text-muted-foreground">{activity.timestamp}</p>
      </div>
    </div>
  );
}
