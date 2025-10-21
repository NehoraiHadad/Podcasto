import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Coins } from 'lucide-react';
import type { UserCreditsData } from '@/lib/actions/credit';

interface CreditBalanceCardProps {
  data: UserCreditsData;
}

/**
 * Displays user's credit balance with visual progress indicator
 * Shows available, used, and total credits with breakdown
 */
export function CreditBalanceCard({ data }: CreditBalanceCardProps) {
  const usagePercentage = data.total_credits > 0
    ? (data.used_credits / data.total_credits) * 100
    : 0;

  const purchasedCredits = data.total_credits - data.free_credits;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Coins className="h-5 w-5 text-yellow-500" />
          Credit Balance
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center">
          <div className="text-5xl font-bold text-primary">
            {data.available_credits}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Available Credits
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Usage</span>
            <span className="font-medium">
              {data.used_credits} / {data.total_credits} used
            </span>
          </div>
          <Progress value={usagePercentage} className="h-2" />
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div>
            <p className="text-xs text-muted-foreground">Free Credits</p>
            <p className="text-2xl font-semibold text-green-600">
              {data.free_credits}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Purchased</p>
            <p className="text-2xl font-semibold text-blue-600">
              {purchasedCredits}
            </p>
          </div>
        </div>

        {data.last_purchase_at && (
          <div className="pt-4 border-t">
            <p className="text-xs text-muted-foreground">Last Purchase</p>
            <p className="text-sm font-medium">
              {new Date(data.last_purchase_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
