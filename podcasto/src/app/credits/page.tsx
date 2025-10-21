import { Metadata } from 'next';
import Link from 'next/link';
import { requireAuth } from '@/lib/actions/user-actions';
import { getUserCreditsAction, getActiveCreditPackagesAction, getEpisodeCostAction } from '@/lib/actions/credit';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreditBalanceCard, CreditPackageCard } from '@/components/credits';
import { TrendingUp, History, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export const metadata: Metadata = {
  title: 'Credits | Podcasto',
  description: 'Manage your credits and purchase packages',
};

export const dynamic = 'force-dynamic';

/**
 * Credits Dashboard Page
 * Displays user's credit balance, available packages, and quick stats
 */
export default async function CreditsPage() {
  await requireAuth();

  const [creditsResult, packagesResult, costResult] = await Promise.all([
    getUserCreditsAction(),
    getActiveCreditPackagesAction(),
    getEpisodeCostAction()
  ]);

  if (!creditsResult.success || !creditsResult.data) {
    return (
      <MainLayout>
        <div className="container mx-auto py-8">
          <Alert variant="destructive">
            <AlertDescription>
              Failed to load credit information: {!creditsResult.success ? creditsResult.error : 'No data returned'}
            </AlertDescription>
          </Alert>
        </div>
      </MainLayout>
    );
  }

  const credits = creditsResult.data;
  const packages = packagesResult.success ? packagesResult.data || [] : [];
  const episodeCost = costResult.success ? costResult.data || 10 : 10;

  const episodesRemaining = Math.floor(credits.available_credits / episodeCost);
  const needsCredits = credits.available_credits < episodeCost;

  return (
    <MainLayout>
      <div className="container mx-auto py-8 space-y-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Credits</h1>
            <p className="text-muted-foreground mt-1">
              Manage your credits and purchase packages
            </p>
          </div>
          <Link href="/credits/history">
            <Button variant="outline" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              Transaction History
            </Button>
          </Link>
        </div>

        {needsCredits && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              You need more credits to generate episodes. Each episode costs {episodeCost} credits.
              Purchase a package below to continue.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <CreditBalanceCard data={credits} />
          </div>

          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Quick Stats
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-muted p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground">Episodes Remaining</p>
                    <p className="text-3xl font-bold text-primary mt-1">
                      {episodesRemaining}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      At {episodeCost} credits each
                    </p>
                  </div>

                  <div className="bg-muted p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground">Total Generated</p>
                    <p className="text-3xl font-bold text-blue-600 mt-1">
                      {Math.floor(credits.used_credits / episodeCost)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Episodes created
                    </p>
                  </div>

                  <div className="bg-muted p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground">Credits Used</p>
                    <p className="text-3xl font-bold text-orange-600 mt-1">
                      {Math.round((credits.used_credits / credits.total_credits) * 100)}%
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Of total credits
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Purchase Credits</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Choose a package that fits your needs
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {packages.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">
                  No credit packages available at this time.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {packages
                .sort((a, b) => a.display_order - b.display_order)
                .map((pkg) => {
                  const isPopular = pkg.name.toLowerCase().includes('pro');
                  return (
                    <CreditPackageCard
                      key={pkg.id}
                      package={pkg}
                      popular={isPopular}
                    />
                  );
                })}
            </div>
          )}
        </div>

        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle className="text-lg">How Credits Work</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold flex-shrink-0">
                1
              </div>
              <div>
                <p className="font-medium">Generate Episodes</p>
                <p className="text-sm text-muted-foreground">
                  Each episode generation costs {episodeCost} credits
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold flex-shrink-0">
                2
              </div>
              <div>
                <p className="font-medium">Track Your Usage</p>
                <p className="text-sm text-muted-foreground">
                  Monitor your credit balance and transaction history
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold flex-shrink-0">
                3
              </div>
              <div>
                <p className="font-medium">Purchase More</p>
                <p className="text-sm text-muted-foreground">
                  Buy credit packages when you need them - they never expire
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
