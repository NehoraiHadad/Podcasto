"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { TopPodcast } from "@/lib/actions/admin/analytics-actions";
import { TrendingUp } from "lucide-react";

interface TopPodcastsTableProps {
  podcasts: TopPodcast[];
}

export function TopPodcastsTable({ podcasts }: TopPodcastsTableProps) {
  const topTen = podcasts.slice(0, 10);

  if (topTen.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Top Podcasts by Subscribers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No podcast data available yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Top Podcasts by Subscribers
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Rank</TableHead>
              <TableHead>Podcast</TableHead>
              <TableHead className="text-right">Subscribers</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {topTen.map((podcast, index) => (
              <TableRow key={podcast.id}>
                <TableCell>
                  <Badge variant={index < 3 ? "default" : "outline"}>
                    #{index + 1}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Link
                    href={`/admin/podcasts/${podcast.id}`}
                    className="font-medium hover:underline"
                  >
                    {podcast.title}
                  </Link>
                </TableCell>
                <TableCell className="text-right">
                  <Badge variant="secondary">
                    {podcast.subscribersCount.toLocaleString()}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
