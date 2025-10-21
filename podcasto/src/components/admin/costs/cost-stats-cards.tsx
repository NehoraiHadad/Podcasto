import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, TrendingUp, FileText, AlertCircle } from 'lucide-react';

interface CostStatsCardsProps {
  totalCost: number;
  episodesCount: number;
  avgCostPerEpisode: number;
  mostExpensiveCost: number;
}

export function CostStatsCards({
  totalCost,
  episodesCount,
  avgCostPerEpisode,
  mostExpensiveCost,
}: CostStatsCardsProps) {
  const stats = [
    {
      title: 'Total Cost (Month)',
      value: `$${totalCost.toFixed(2)}`,
      icon: DollarSign,
      iconColor: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Episodes Generated',
      value: episodesCount.toString(),
      icon: FileText,
      iconColor: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Avg Cost/Episode',
      value: `$${avgCostPerEpisode.toFixed(4)}`,
      icon: TrendingUp,
      iconColor: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'Most Expensive',
      value: `$${mostExpensiveCost.toFixed(4)}`,
      icon: AlertCircle,
      iconColor: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <div className={`rounded-full p-2 ${stat.bgColor}`}>
                <Icon className={`h-4 w-4 ${stat.iconColor}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
