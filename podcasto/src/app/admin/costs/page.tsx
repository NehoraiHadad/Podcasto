import { checkIsAdmin } from '@/lib/actions/admin/auth-actions';
import { db } from '@/lib/db';
import { episodeCosts, episodes, podcasts } from '@/lib/db/schema';
import { eq, desc, sql } from 'drizzle-orm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CostsOverview } from '@/components/admin/costs/costs-overview';
import { EpisodeCostsTable } from '@/components/admin/costs/episode-costs-table';
import { PodcastCostsTable } from '@/components/admin/costs/podcast-costs-table';
import { UserCostsTable } from '@/components/admin/costs/user-costs-table';
import { CostDataManagement } from '@/components/admin/costs/cost-data-management';
import { getAllUserCosts } from '@/lib/actions/cost';

export const metadata = {
  title: 'Cost Tracking | Admin Dashboard | Podcasto',
  description: 'Monitor AI and AWS costs for podcast generation',
};

export const dynamic = 'force-dynamic';

export default async function CostsPage() {
  await checkIsAdmin({ redirectOnFailure: true });

  // Get current month start/end
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  // Fetch all episodes with costs (for this month)
  const episodesWithCosts = await db
    .select({
      episodeId: episodes.id,
      episodeTitle: episodes.title,
      totalCostUsd: episodeCosts.total_cost_usd,
      aiTextCost: episodeCosts.ai_text_cost_usd,
      aiImageCost: episodeCosts.ai_image_cost_usd,
      aiTtsCost: episodeCosts.ai_tts_cost_usd,
      lambdaCost: episodeCosts.lambda_execution_cost_usd,
      s3OpsCost: episodeCosts.s3_operations_cost_usd,
      s3StorageCost: episodeCosts.s3_storage_cost_usd,
      emailCost: episodeCosts.email_cost_usd,
      sqsCost: episodeCosts.sqs_cost_usd,
      totalTokens: episodeCosts.total_tokens,
      calculatedAt: episodeCosts.cost_calculated_at,
      createdAt: episodes.created_at,
    })
    .from(episodes)
    .innerJoin(episodeCosts, eq(episodes.id, episodeCosts.episode_id))
    .where(
      sql`${episodes.created_at} >= ${monthStart.toISOString()} AND ${episodes.created_at} <= ${monthEnd.toISOString()}`
    )
    .orderBy(desc(episodeCosts.cost_calculated_at));

  // Calculate stats
  const totalCost = episodesWithCosts.reduce(
    (sum, ep) => sum + parseFloat(ep.totalCostUsd),
    0
  );
  const avgCost =
    episodesWithCosts.length > 0 ? totalCost / episodesWithCosts.length : 0;
  const mostExpensive =
    episodesWithCosts.length > 0
      ? Math.max(...episodesWithCosts.map((ep) => parseFloat(ep.totalCostUsd)))
      : 0;

  // Transform for episode costs table
  const episodesList = episodesWithCosts.map((ep) => {
    const aiCost =
      parseFloat(ep.aiTextCost) +
      parseFloat(ep.aiImageCost) +
      parseFloat(ep.aiTtsCost);
    const awsCost =
      parseFloat(ep.lambdaCost) +
      parseFloat(ep.s3OpsCost) +
      parseFloat(ep.s3StorageCost) +
      parseFloat(ep.emailCost) +
      parseFloat(ep.sqsCost);

    return {
      episodeId: ep.episodeId,
      episodeTitle: ep.episodeTitle,
      totalCostUsd: ep.totalCostUsd,
      aiCostUsd: aiCost.toFixed(6),
      awsCostUsd: awsCost.toFixed(6),
      totalTokens: ep.totalTokens,
      calculatedAt: ep.calculatedAt,
    };
  });

  // Get recent 10 for overview
  const recentEpisodes = episodesList.slice(0, 10);

  // Aggregate by podcast
  const podcastsWithCosts = await db
    .select({
      podcastId: episodes.podcast_id,
      podcastTitle: podcasts.title,
      episodeCount: sql<number>`count(${episodes.id})`,
      totalCost: sql<number>`sum(cast(${episodeCosts.total_cost_usd} as decimal))`,
    })
    .from(episodes)
    .innerJoin(episodeCosts, eq(episodes.id, episodeCosts.episode_id))
    .innerJoin(podcasts, eq(episodes.podcast_id, podcasts.id))
    .groupBy(episodes.podcast_id, podcasts.title)
    .orderBy(desc(sql`sum(cast(${episodeCosts.total_cost_usd} as decimal))`));

  const podcastsList = podcastsWithCosts
    .filter((p) => p.podcastId !== null)
    .map((p) => ({
      podcastId: p.podcastId!,
      podcastTitle: p.podcastTitle,
      episodeCount: Number(p.episodeCount),
      totalCost: Number(p.totalCost),
      avgCostPerEpisode: Number(p.totalCost) / Number(p.episodeCount),
    }));

  // Fetch all user costs
  const userCostsResult = await getAllUserCosts();
  const usersList = userCostsResult.success && userCostsResult.users ? userCostsResult.users : [];
  const grandTotalCost = userCostsResult.success && userCostsResult.grandTotalCost ? userCostsResult.grandTotalCost : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Cost Tracking</h1>
        <p className="text-muted-foreground mt-1">
          Monitor AI and AWS costs for podcast generation
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="episodes">Episodes</TabsTrigger>
          <TabsTrigger value="podcasts">Podcasts</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="manage">Data Management</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <CostsOverview
            totalCost={totalCost}
            episodesCount={episodesWithCosts.length}
            avgCostPerEpisode={avgCost}
            mostExpensiveCost={mostExpensive}
            recentEpisodes={recentEpisodes}
          />
        </TabsContent>

        <TabsContent value="episodes" className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-4">
              All Episodes ({episodesList.length})
            </h3>
            <EpisodeCostsTable episodes={episodesList} />
          </div>
        </TabsContent>

        <TabsContent value="podcasts" className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-4">
              Costs by Podcast ({podcastsList.length})
            </h3>
            <PodcastCostsTable podcasts={podcastsList} />
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-4">
              Costs by User ({usersList.length})
            </h3>
            <UserCostsTable users={usersList} grandTotalCost={grandTotalCost} />
          </div>
        </TabsContent>

        <TabsContent value="manage" className="space-y-4">
          <CostDataManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
}
