import {
  getWeeklySummaryReport,
  getProblematicPodcastsReport,
} from '@/lib/actions/admin/generation-reports';
import { Card, CardContent } from '@/components/ui/card';
import { WeeklySummaryChart } from './weekly-summary-chart';
import { ProblematicPodcastsTable } from './problematic-podcasts-table';

/**
 * Server component for generation reports page
 * Fetches weekly summary and problematic podcasts data
 */
export async function GenerationReportsPage() {
  try {
    const [weeklyResult, problematicResult] = await Promise.all([
      getWeeklySummaryReport(),
      getProblematicPodcastsReport(7, 3, 0.8),
    ]);

    // Handle errors
    if (!weeklyResult.success) {
      return (
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Generation Reports</h1>
            <p className="text-muted-foreground mt-2">
              Episode generation analytics and monitoring
            </p>
          </div>
          <Card>
            <CardContent className="pt-6">
              <p className="text-destructive">
                Failed to load weekly summary: {weeklyResult.error}
              </p>
            </CardContent>
          </Card>
        </div>
      );
    }

    if (!problematicResult.success) {
      return (
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Generation Reports</h1>
            <p className="text-muted-foreground mt-2">
              Episode generation analytics and monitoring
            </p>
          </div>
          <Card>
            <CardContent className="pt-6">
              <p className="text-destructive">
                Failed to load problematic podcasts: {problematicResult.error}
              </p>
            </CardContent>
          </Card>
        </div>
      );
    }

    // Both results are successful, data is guaranteed to exist
    const weeklyData = weeklyResult.data!;
    const problematicData = problematicResult.data!;

    return (
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Generation Reports</h1>
          <p className="text-muted-foreground mt-2">
            Episode generation analytics and monitoring
          </p>
        </div>

        {/* Weekly Summary Section */}
        <WeeklySummaryChart
          dailyReports={weeklyData.dailyReports}
          weeklyTotals={weeklyData.weeklyTotals}
        />

        {/* Problematic Podcasts Section */}
        <ProblematicPodcastsTable podcasts={problematicData} />
      </div>
    );
  } catch (error) {
    console.error('[GenerationReportsPage] Error:', error);
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Generation Reports</h1>
          <p className="text-muted-foreground mt-2">
            Episode generation analytics and monitoring
          </p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-destructive">
              An unexpected error occurred while loading reports.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              {error instanceof Error ? error.message : 'Unknown error'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }
}
