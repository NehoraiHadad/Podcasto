'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface DailyReport {
  date: string;
  total: number;
  successful: number;
  failed: number;
  byStatus: Record<string, number>;
}

interface WeeklyTotals {
  total: number;
  successful: number;
  failed: number;
  successRate: number;
}

interface WeeklySummaryChartProps {
  dailyReports: DailyReport[];
  weeklyTotals: WeeklyTotals;
}

/**
 * Client component displaying weekly generation summary
 * Shows daily stats and overall success rate
 */
export function WeeklySummaryChart({
  dailyReports,
  weeklyTotals,
}: WeeklySummaryChartProps) {
  const getSuccessRateBadge = (rate: number) => {
    if (rate >= 80) {
      return (
        <Badge variant="default" className="bg-green-500 hover:bg-green-600">
          {rate.toFixed(1)}% Success
        </Badge>
      );
    }
    if (rate >= 50) {
      return (
        <Badge variant="secondary" className="bg-yellow-500 hover:bg-yellow-600 text-white">
          {rate.toFixed(1)}% Success
        </Badge>
      );
    }
    return (
      <Badge variant="destructive">
        {rate.toFixed(1)}% Success
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Weekly Generation Summary</CardTitle>
          {getSuccessRateBadge(weeklyTotals.successRate)}
        </div>
      </CardHeader>
      <CardContent>
        {/* Weekly Totals */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">Total Attempts</p>
            <p className="text-2xl font-bold">{weeklyTotals.total}</p>
          </div>
          <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
            <p className="text-sm text-muted-foreground">Successful</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {weeklyTotals.successful}
            </p>
          </div>
          <div className="p-4 bg-red-50 dark:bg-red-950 rounded-lg">
            <p className="text-sm text-muted-foreground">Failed</p>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
              {weeklyTotals.failed}
            </p>
          </div>
        </div>

        {/* Daily Breakdown Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Successful</TableHead>
                <TableHead className="text-right">Failed</TableHead>
                <TableHead className="text-right">Success Rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dailyReports.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No data available for the past 7 days
                  </TableCell>
                </TableRow>
              ) : (
                dailyReports.map((day) => {
                  const successRate = day.total > 0
                    ? Math.round((day.successful / day.total) * 1000) / 10
                    : 0;

                  return (
                    <TableRow key={day.date}>
                      <TableCell className="font-medium">
                        {formatDate(day.date)}
                      </TableCell>
                      <TableCell className="text-right">{day.total}</TableCell>
                      <TableCell className="text-right text-green-600 dark:text-green-400">
                        {day.successful}
                      </TableCell>
                      <TableCell className="text-right text-red-600 dark:text-red-400">
                        {day.failed}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={
                          successRate >= 80
                            ? 'text-green-600 dark:text-green-400'
                            : successRate >= 50
                            ? 'text-yellow-600 dark:text-yellow-400'
                            : 'text-red-600 dark:text-red-400'
                        }>
                          {successRate.toFixed(1)}%
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
