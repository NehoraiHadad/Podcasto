#!/usr/bin/env tsx

/**
 * Find Duplicate Podcasts Script
 *
 * This script analyzes podcasts in the database to identify potential duplicates
 * that could be merged into multilingual podcast groups.
 *
 * Features:
 * - Fuzzy title matching to find similar podcast names
 * - Language detection from podcast_configs.language field
 * - Groups podcasts by similarity
 * - Outputs JSON file with suggested groups
 *
 * Usage:
 *   npx tsx scripts/find-duplicate-podcasts.ts
 *   npx tsx scripts/find-duplicate-podcasts.ts --output suggested-groups.json
 */

import { db } from '../src/lib/db';
import { podcasts, podcastConfigs } from '../src/lib/db/schema';
import { eq } from 'drizzle-orm';
import * as fs from 'fs';
import * as path from 'path';

interface PodcastWithConfig {
  id: string;
  title: string;
  description: string | null;
  language?: string;
  podcast_group_id?: string | null;
}

interface SuggestedGroup {
  suggested_base_title: string;
  similarity_score: number;
  podcasts: Array<{
    id: string;
    title: string;
    language: string;
    description?: string | null;
  }>;
}

/**
 * Calculate similarity score between two strings using Levenshtein distance
 * Returns a score between 0 (completely different) and 1 (identical)
 */
function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();

  if (s1 === s2) return 1;

  const len1 = s1.length;
  const len2 = s2.length;
  const maxLen = Math.max(len1, len2);

  if (maxLen === 0) return 1;

  const distance = levenshteinDistance(s1, s2);
  return 1 - distance / maxLen;
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

/**
 * Normalize podcast title by removing common language suffixes
 */
function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/\s+(hebrew|english|arabic|spanish|french|german|russian|עברית|אנגלית)$/i, '')
    .replace(/\s+\(.*?\)$/, '') // Remove parenthetical suffixes
    .replace(/\s+-\s+.*?$/, '') // Remove dash suffixes
    .trim();
}

/**
 * Extract base title from a group of similar titles
 */
function extractBaseTitle(titles: string[]): string {
  // Use the shortest normalized title as base
  const normalized = titles.map(t => normalizeTitle(t));
  return normalized.reduce((a, b) => (a.length <= b.length ? a : b));
}

/**
 * Find duplicate podcasts and group them
 */
async function findDuplicatePodcasts(): Promise<SuggestedGroup[]> {
  console.log('📚 Fetching podcasts from database...');

  // Get all podcasts that are NOT already in groups
  const allPodcasts = await db
    .select({
      id: podcasts.id,
      title: podcasts.title,
      description: podcasts.description,
      podcast_group_id: podcasts.podcast_group_id,
    })
    .from(podcasts)
    .where(eq(podcasts.podcast_group_id, null as any)); // Only get podcasts not in groups

  console.log(`Found ${allPodcasts.length} podcasts not in groups`);

  // Fetch language info from podcast_configs
  const podcastsWithLanguage: PodcastWithConfig[] = await Promise.all(
    allPodcasts.map(async (podcast) => {
      const config = await db
        .select({ language: podcastConfigs.language })
        .from(podcastConfigs)
        .where(eq(podcastConfigs.podcast_id, podcast.id))
        .limit(1);

      return {
        ...podcast,
        language: config[0]?.language || 'english',
      };
    })
  );

  console.log('🔍 Analyzing titles for duplicates...');

  // Group podcasts by similarity
  const groups: Map<string, PodcastWithConfig[]> = new Map();
  const processed = new Set<string>();

  for (let i = 0; i < podcastsWithLanguage.length; i++) {
    const podcast1 = podcastsWithLanguage[i];

    if (processed.has(podcast1.id)) continue;

    const normalizedTitle1 = normalizeTitle(podcast1.title);
    const similarPodcasts: PodcastWithConfig[] = [podcast1];

    for (let j = i + 1; j < podcastsWithLanguage.length; j++) {
      const podcast2 = podcastsWithLanguage[j];

      if (processed.has(podcast2.id)) continue;

      const normalizedTitle2 = normalizeTitle(podcast2.title);
      const similarity = calculateSimilarity(normalizedTitle1, normalizedTitle2);

      // Consider podcasts similar if similarity > 0.7
      if (similarity > 0.7) {
        similarPodcasts.push(podcast2);
        processed.add(podcast2.id);
      }
    }

    // Only create groups for podcasts with at least one match
    if (similarPodcasts.length > 1) {
      const baseTitle = extractBaseTitle(similarPodcasts.map(p => p.title));
      groups.set(baseTitle, similarPodcasts);
      processed.add(podcast1.id);
    }
  }

  console.log(`Found ${groups.size} potential podcast groups`);

  // Convert to suggested groups format
  const suggestedGroups: SuggestedGroup[] = Array.from(groups.entries()).map(
    ([baseTitle, groupPodcasts]) => {
      // Calculate average similarity within group
      let totalSimilarity = 0;
      let comparisons = 0;

      for (let i = 0; i < groupPodcasts.length; i++) {
        for (let j = i + 1; j < groupPodcasts.length; j++) {
          totalSimilarity += calculateSimilarity(
            normalizeTitle(groupPodcasts[i].title),
            normalizeTitle(groupPodcasts[j].title)
          );
          comparisons++;
        }
      }

      const avgSimilarity = comparisons > 0 ? totalSimilarity / comparisons : 1;

      return {
        suggested_base_title: baseTitle,
        similarity_score: Math.round(avgSimilarity * 100) / 100,
        podcasts: groupPodcasts.map(p => ({
          id: p.id,
          title: p.title,
          language: p.language || 'english',
          description: p.description,
        })),
      };
    }
  );

  // Sort by similarity score (highest first)
  suggestedGroups.sort((a, b) => b.similarity_score - a.similarity_score);

  return suggestedGroups;
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2);
  const outputIndex = args.indexOf('--output');
  const outputFile =
    outputIndex !== -1 && args[outputIndex + 1]
      ? args[outputIndex + 1]
      : 'suggested-podcast-groups.json';

  const outputPath = path.resolve(process.cwd(), outputFile);

  console.log('🚀 Starting duplicate podcast detection...\n');

  try {
    const suggestedGroups = await findDuplicatePodcasts();

    if (suggestedGroups.length === 0) {
      console.log('✅ No duplicate podcasts found!');
      return;
    }

    // Write to file
    fs.writeFileSync(outputPath, JSON.stringify(suggestedGroups, null, 2));

    console.log(`\n✅ Analysis complete!`);
    console.log(`📄 Suggested groups saved to: ${outputPath}`);
    console.log(`\nSummary:`);
    console.log(`- Total groups suggested: ${suggestedGroups.length}`);
    console.log(`- Total podcasts to migrate: ${suggestedGroups.reduce((sum, g) => sum + g.podcasts.length, 0)}`);

    // Print top 5 suggestions
    console.log(`\nTop 5 suggestions:`);
    suggestedGroups.slice(0, 5).forEach((group, index) => {
      console.log(`\n${index + 1}. "${group.suggested_base_title}" (similarity: ${group.similarity_score})`);
      group.podcasts.forEach(p => {
        console.log(`   - [${p.language}] ${p.title}`);
      });
    });

    if (suggestedGroups.length > 5) {
      console.log(`\n... and ${suggestedGroups.length - 5} more groups`);
    }

    console.log(`\n💡 Review the output file and use the migration tool in the admin panel to merge podcasts.`);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Run the script
main();
