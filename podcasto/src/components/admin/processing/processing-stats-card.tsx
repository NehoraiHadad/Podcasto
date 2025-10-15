import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

/**
 * Stats format returned by server action
 */
export interface ProcessingStatsCardProps {
  stats: {
    byStage: Record<string, { total: number; avgDuration: number }>;
    byStatus: Record<string, number>;
    totalLogs: number;
  };
  className?: string;
}

/**
 * Card component displaying aggregated processing statistics
 */
export function ProcessingStatsCard({ stats, className }: ProcessingStatsCardProps) {
  // Calculate overall success rate
  const totalCompleted = stats.byStatus['completed'] || 0;
  const totalFailed = stats.byStatus['failed'] || 0;
  const successRate =
    totalCompleted + totalFailed > 0
      ? ((totalCompleted / (totalCompleted + totalFailed)) * 100).toFixed(1)
      : 0;

  // Calculate failure rates manually
  const failureRates: Record<string, number> = {};
  Object.keys(stats.byStage).forEach((stage) => {
    const failedStage = `${stage}_failed`;
    if (stats.byStage[failedStage]) {
      const total = stats.byStage[stage]?.total || 1;
      const failed = stats.byStage[failedStage]?.total || 0;
      failureRates[stage] = (failed / total) * 100;
    }
  });

  // Get top failure stages
  const failureEntries = Object.entries(failureRates)
    .filter(([_, rate]) => rate > 0)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);

  // Format duration in human-readable format
  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  // Get key stages for average duration display
  const keyStages = [
    'telegram_processing',
    'script_processing',
    'audio_processing'
  ];

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg">Processing Statistics</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Total Logs</p>
            <p className="text-2xl font-bold">{stats.totalLogs}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Success Rate</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {successRate}%
            </p>
          </div>
        </div>

        <Separator />

        {/* Average Durations */}
        <div>
          <h4 className="text-sm font-semibold mb-2">Average Processing Time</h4>
          <div className="space-y-2">
            {keyStages.map((stage) => {
              const stageData = stats.byStage[stage];
              if (!stageData?.avgDuration) return null;

              return (
                <div key={stage} className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground capitalize">
                    {stage.replace(/_/g, ' ')}
                  </span>
                  <span className="font-medium">
                    {formatDuration(stageData.avgDuration)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Failure Points */}
        {failureEntries.length > 0 && (
          <>
            <Separator />
            <div>
              <h4 className="text-sm font-semibold mb-2">Common Failure Points</h4>
              <div className="space-y-2">
                {failureEntries.map(([stage, rate]) => (
                  <div key={stage} className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground capitalize">
                      {stage.replace(/_/g, ' ')}
                    </span>
                    <span className="font-medium text-red-600 dark:text-red-400">
                      {rate.toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
