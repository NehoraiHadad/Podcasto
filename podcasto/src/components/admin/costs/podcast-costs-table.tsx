import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CostBreakdownBadge } from './cost-breakdown-badge';

interface PodcastCostSummary {
  podcastId: string;
  podcastTitle: string;
  episodeCount: number;
  totalCost: number;
  avgCostPerEpisode: number;
}

interface PodcastCostsTableProps {
  podcasts: PodcastCostSummary[];
}

export function PodcastCostsTable({ podcasts }: PodcastCostsTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Podcast</TableHead>
            <TableHead>Episodes</TableHead>
            <TableHead>Total Cost</TableHead>
            <TableHead>Avg Cost/Episode</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {podcasts.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-muted-foreground">
                No podcast data available
              </TableCell>
            </TableRow>
          ) : (
            podcasts.map((podcast) => (
              <TableRow key={podcast.podcastId}>
                <TableCell className="font-medium max-w-xs truncate">
                  {podcast.podcastTitle}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {podcast.episodeCount}
                </TableCell>
                <TableCell>
                  <CostBreakdownBadge
                    label="Total"
                    value={podcast.totalCost.toFixed(4)}
                    variant="total"
                  />
                </TableCell>
                <TableCell>
                  <CostBreakdownBadge
                    label="Avg"
                    value={podcast.avgCostPerEpisode.toFixed(4)}
                    variant="ai"
                  />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
