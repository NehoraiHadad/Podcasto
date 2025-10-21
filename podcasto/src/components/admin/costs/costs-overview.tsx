import { CostStatsCards } from './cost-stats-cards';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CostBreakdownBadge } from './cost-breakdown-badge';

interface RecentEpisode {
  episodeId: string;
  episodeTitle: string | null;
  totalCostUsd: string;
  aiCostUsd: string;
  awsCostUsd: string;
  calculatedAt: Date | null;
}

interface CostsOverviewProps {
  totalCost: number;
  episodesCount: number;
  avgCostPerEpisode: number;
  mostExpensiveCost: number;
  recentEpisodes: RecentEpisode[];
}

export function CostsOverview({
  totalCost,
  episodesCount,
  avgCostPerEpisode,
  mostExpensiveCost,
  recentEpisodes,
}: CostsOverviewProps) {
  return (
    <div className="space-y-6">
      <CostStatsCards
        totalCost={totalCost}
        episodesCount={episodesCount}
        avgCostPerEpisode={avgCostPerEpisode}
        mostExpensiveCost={mostExpensiveCost}
      />

      <div>
        <h3 className="text-lg font-semibold mb-4">Recent Episodes</h3>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Episode</TableHead>
                <TableHead>AI Cost</TableHead>
                <TableHead>AWS Cost</TableHead>
                <TableHead>Total Cost</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentEpisodes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No recent episodes
                  </TableCell>
                </TableRow>
              ) : (
                recentEpisodes.map((ep) => (
                  <TableRow key={ep.episodeId}>
                    <TableCell className="font-medium max-w-xs truncate">
                      {ep.episodeTitle || 'Untitled'}
                    </TableCell>
                    <TableCell>
                      <CostBreakdownBadge
                        label="AI"
                        value={ep.aiCostUsd}
                        variant="ai"
                      />
                    </TableCell>
                    <TableCell>
                      <CostBreakdownBadge
                        label="AWS"
                        value={ep.awsCostUsd}
                        variant="aws"
                      />
                    </TableCell>
                    <TableCell>
                      <CostBreakdownBadge
                        label="Total"
                        value={ep.totalCostUsd}
                        variant="total"
                      />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {ep.calculatedAt
                        ? new Date(ep.calculatedAt).toLocaleDateString()
                        : 'N/A'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
