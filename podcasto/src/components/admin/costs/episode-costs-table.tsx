'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { CostBreakdownBadge } from './cost-breakdown-badge';
import { Search } from 'lucide-react';

interface EpisodeCost {
  episodeId: string;
  episodeTitle: string | null;
  totalCostUsd: string;
  aiCostUsd: string;
  awsCostUsd: string;
  totalTokens: number;
  calculatedAt: Date | null;
}

interface EpisodeCostsTableProps {
  episodes: EpisodeCost[];
}

export function EpisodeCostsTable({ episodes }: EpisodeCostsTableProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredEpisodes = episodes.filter((ep) =>
    ep.episodeTitle?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search episodes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-8"
        />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Episode</TableHead>
              <TableHead>AI Cost</TableHead>
              <TableHead>AWS Cost</TableHead>
              <TableHead>Total Cost</TableHead>
              <TableHead>Tokens</TableHead>
              <TableHead>Calculated</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEpisodes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No episodes found
                </TableCell>
              </TableRow>
            ) : (
              filteredEpisodes.map((ep) => (
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
                    {ep.totalTokens.toLocaleString()}
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
  );
}
