/**
 * Script to verify cost tracking accuracy
 * Run: npx tsx scripts/verify-cost-tracking.ts [episode-id]
 */

import { db } from '../src/lib/db';
import { episodes, episodeCosts, costTrackingEvents } from '../src/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

async function verifyCostTracking(episodeId?: string) {
  console.log('🔍 Cost Tracking Verification\n');

  // Get the most recent episode if no ID provided
  let targetEpisodeId = episodeId;
  if (!targetEpisodeId) {
    const recentEpisode = await db
      .select({ id: episodes.id, title: episodes.title })
      .from(episodes)
      .orderBy(desc(episodes.created_at))
      .limit(1);

    if (recentEpisode.length === 0) {
      console.log('❌ No episodes found');
      return;
    }

    targetEpisodeId = recentEpisode[0].id;
    console.log(`📌 Using most recent episode: ${recentEpisode[0].title}`);
    console.log(`   ID: ${targetEpisodeId}\n`);
  }

  // Get episode costs summary
  const costSummary = await db
    .select()
    .from(episodeCosts)
    .where(eq(episodeCosts.episode_id, targetEpisodeId))
    .limit(1);

  if (costSummary.length === 0) {
    console.log('❌ No cost summary found for this episode');
    console.log('   This means calculateEpisodeCost() was not called or failed\n');

    // Check if there are any events
    const events = await db
      .select()
      .from(costTrackingEvents)
      .where(eq(costTrackingEvents.episode_id, targetEpisodeId));

    console.log(`📊 Raw events found: ${events.length}`);
    if (events.length > 0) {
      console.log('   Events exist but were not aggregated into episode_costs');
      console.log('   Possible issue: post-processing did not run\n');
    } else {
      console.log('   No events found - cost tracking did not run at all\n');
    }
    return;
  }

  const summary = costSummary[0];

  // Get all cost events for this episode
  const events = await db
    .select()
    .from(costTrackingEvents)
    .where(eq(costTrackingEvents.episode_id, targetEpisodeId))
    .orderBy(desc(costTrackingEvents.timestamp));

  console.log('📊 COST SUMMARY');
  console.log('===============');
  console.log(`Total Cost:     $${summary.total_cost_usd}`);
  console.log(`AI Text Cost:   $${summary.ai_text_cost_usd}`);
  console.log(`AI Image Cost:  $${summary.ai_image_cost_usd}`);
  console.log(`AI TTS Cost:    $${summary.ai_tts_cost_usd}`);
  console.log(`Lambda Cost:    $${summary.lambda_execution_cost_usd}`);
  console.log(`S3 Ops Cost:    $${summary.s3_operations_cost_usd}`);
  console.log(`S3 Storage:     $${summary.s3_storage_cost_usd}`);
  console.log(`Email Cost:     $${summary.email_cost_usd}`);
  console.log(`SQS Cost:       $${summary.sqs_cost_usd}`);
  console.log(`\nTotal Tokens:   ${summary.total_tokens.toLocaleString()}`);
  console.log(`Total Emails:   ${summary.total_emails_sent}`);
  console.log(`S3 Operations:  ${summary.total_s3_operations}`);
  console.log(`Storage (MB):   ${summary.storage_mb}\n`);

  console.log('📝 DETAILED EVENTS');
  console.log('==================');
  console.log(`Total events: ${events.length}\n`);

  // Group events by service
  const eventsByService = events.reduce((acc, event) => {
    const service = event.service;
    if (!acc[service]) {
      acc[service] = [];
    }
    acc[service].push(event);
    return acc;
  }, {} as Record<string, typeof events>);

  for (const [service, serviceEvents] of Object.entries(eventsByService)) {
    const totalCost = serviceEvents.reduce((sum, e) => sum + parseFloat(e.total_cost_usd), 0);
    const totalQuantity = serviceEvents.reduce((sum, e) => sum + parseFloat(e.quantity), 0);

    console.log(`🔹 ${service.toUpperCase()}`);
    console.log(`   Events: ${serviceEvents.length}`);
    console.log(`   Total Quantity: ${totalQuantity.toLocaleString()} ${serviceEvents[0].unit}`);
    console.log(`   Total Cost: $${totalCost.toFixed(6)}`);
    console.log(`   Unit Cost: $${serviceEvents[0].unit_cost_usd}`);

    // Show details for first event
    if (serviceEvents.length > 0) {
      const firstEvent = serviceEvents[0];
      console.log(`   Sample: ${firstEvent.quantity} ${firstEvent.unit} × $${firstEvent.unit_cost_usd} = $${firstEvent.total_cost_usd}`);
      if (firstEvent.metadata) {
        const meta = firstEvent.metadata as Record<string, unknown>;
        console.log(`   Metadata:`, JSON.stringify(meta, null, 2).split('\n').join('\n              '));
      }
    }
    console.log('');
  }

  // VERIFICATION CHECKS
  console.log('✅ VERIFICATION CHECKS');
  console.log('======================\n');

  // Check 1: Are all expected services tracked?
  const expectedServices = ['gemini_text', 's3_put', 'sqs'];
  const trackedServices = Object.keys(eventsByService);
  const missingServices = expectedServices.filter(s => !trackedServices.includes(s));

  if (missingServices.length > 0) {
    console.log(`⚠️  Missing services: ${missingServices.join(', ')}`);
    console.log('   These operations may not have been tracked\n');
  } else {
    console.log('✅ All expected core services are tracked\n');
  }

  // Check 2: Token count reasonable?
  if (summary.total_tokens < 100) {
    console.log('⚠️  Total tokens very low (<100)');
    console.log('   This might indicate missing AI calls or incorrect tracking\n');
  } else if (summary.total_tokens > 100000) {
    console.log('⚠️  Total tokens very high (>100k)');
    console.log('   This might indicate duplicate tracking or error\n');
  } else {
    console.log(`✅ Token count reasonable: ${summary.total_tokens.toLocaleString()}\n`);
  }

  // Check 3: Image generation tracked?
  const imageEvents = eventsByService['gemini_image'] || [];
  if (imageEvents.length === 0) {
    console.log('⚠️  No image generation tracked');
    console.log('   Image may have been skipped or not generated\n');
  } else {
    console.log(`✅ Image generation tracked: ${imageEvents.length} image(s) @ $0.01 each\n`);
  }

  // Check 4: Pricing accuracy
  console.log('💰 PRICING VERIFICATION');
  console.log('=======================\n');
  console.log('Current pricing constants:');
  console.log('  Gemini Text:  $0.00000075 per token');
  console.log('  Gemini Image: $0.01 per image');
  console.log('  S3 PUT:       $0.000005 per request');
  console.log('  SES Email:    $0.0001 per email');
  console.log('  SQS Request:  $0.0000004 per request\n');

  // Manual calculation example
  const textEvents = eventsByService['gemini_text'] || [];
  if (textEvents.length > 0) {
    const totalTokens = textEvents.reduce((sum, e) => sum + parseFloat(e.quantity), 0);
    const expectedCost = totalTokens * 0.00000075;
    const actualCost = parseFloat(summary.ai_text_cost_usd);
    const diff = Math.abs(expectedCost - actualCost);

    console.log('Text Generation Verification:');
    console.log(`  Tokens: ${totalTokens.toLocaleString()}`);
    console.log(`  Expected: ${totalTokens} × $0.00000075 = $${expectedCost.toFixed(6)}`);
    console.log(`  Actual:   $${actualCost.toFixed(6)}`);
    console.log(`  Diff:     $${diff.toFixed(6)} ${diff < 0.000001 ? '✅' : '⚠️'}\n`);
  }

  console.log('🎯 RECOMMENDATIONS');
  console.log('==================\n');

  if (parseFloat(summary.total_cost_usd) < 0.01) {
    console.log('💡 Total cost is very low (<$0.01)');
    console.log('   This is normal for a single episode!');
    console.log('   Typical costs:');
    console.log('   - Text generation: 1000-5000 tokens = $0.00075-$0.00375');
    console.log('   - Image generation: 1 image = $0.01');
    console.log('   - AWS services: <$0.001');
    console.log('   - Total per episode: ~$0.01-$0.02\n');
  }
}

// Parse command line args
const episodeId = process.argv[2];
verifyCostTracking(episodeId)
  .then(() => {
    console.log('✅ Verification complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
