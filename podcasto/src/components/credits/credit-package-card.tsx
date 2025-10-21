import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Sparkles } from 'lucide-react';

interface CreditPackageRecord {
  id: string;
  name: string;
  credits_amount: string;
  price_usd: string;
  description: string | null;
  is_active: boolean;
  display_order: number;
}

interface CreditPackageCardProps {
  package: CreditPackageRecord;
  popular?: boolean;
}

/**
 * Displays a credit package with pricing and purchase option
 * Highlights popular packages with special styling
 */
export function CreditPackageCard({ package: pkg, popular = false }: CreditPackageCardProps) {
  const credits = parseFloat(pkg.credits_amount);
  const price = parseFloat(pkg.price_usd);
  const pricePerCredit = (price / credits).toFixed(3);

  return (
    <Card className={`relative ${popular ? 'border-primary shadow-lg' : ''}`}>
      {popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="bg-primary text-primary-foreground flex items-center gap-1">
            <Sparkles className="h-3 w-3" />
            Most Popular
          </Badge>
        </div>
      )}

      <CardHeader className="text-center pb-4">
        <CardTitle className="text-xl">{pkg.name}</CardTitle>
        {pkg.description && (
          <CardDescription className="text-sm">
            {pkg.description}
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <CreditCard className="h-5 w-5 text-muted-foreground" />
            <div className="text-4xl font-bold text-primary">
              {credits.toLocaleString()}
            </div>
          </div>
          <p className="text-sm text-muted-foreground">Credits</p>
        </div>

        <div className="text-center space-y-1">
          <div className="text-3xl font-bold">
            ${price.toFixed(2)}
          </div>
          <p className="text-xs text-muted-foreground">
            ${pricePerCredit} per credit
          </p>
        </div>

        <div className="bg-muted p-3 rounded-md text-center">
          <p className="text-sm font-medium">
            Generate up to {Math.floor(credits / 10)} episodes
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            10 credits per episode
          </p>
        </div>

        <Button
          className="w-full"
          size="lg"
          variant={popular ? 'default' : 'outline'}
          disabled
        >
          Purchase Credits
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          Payment integration coming soon
        </p>
      </CardContent>
    </Card>
  );
}
