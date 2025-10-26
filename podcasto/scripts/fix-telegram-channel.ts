#!/usr/bin/env tsx
/**
 * Fix telegram_channel name for MathyAIwithMike (English) podcast
 *
 * Problem: Channel name stored as description instead of actual channel name
 * Solution: Update to correct channel name: science_and_ai_with_mike_english
 */

import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

const PODCAST_ID = 'c25b0c24-f9bf-4102-97f8-edca39a59489';
const CORRECT_CHANNEL_NAME = 'science_and_ai_with_mike_english';

async function fixTelegramChannel() {
  try {
    console.log('🔍 Step 1: Checking current state...\n');

    const before = await db.execute(sql`
      SELECT
        id,
        podcast_id,
        telegram_channel,
        updated_at
      FROM podcast_configs
      WHERE podcast_id = ${PODCAST_ID}
    `);

    console.log('Current state:');
    console.log(JSON.stringify(before, null, 2));

    console.log('\n🔧 Step 2: Updating telegram_channel to correct name...\n');

    const update = await db.execute(sql`
      UPDATE podcast_configs
      SET
        telegram_channel = ${CORRECT_CHANNEL_NAME},
        updated_at = NOW()
      WHERE podcast_id = ${PODCAST_ID}
      RETURNING id, podcast_id, telegram_channel, updated_at
    `);

    console.log('Update result:');
    console.log(JSON.stringify(update, null, 2));

    console.log('\n✅ Step 3: Verifying the update...\n');

    const after = await db.execute(sql`
      SELECT
        id,
        podcast_id,
        telegram_channel,
        updated_at
      FROM podcast_configs
      WHERE podcast_id = ${PODCAST_ID}
    `);

    console.log('Updated state:');
    console.log(JSON.stringify(after, null, 2));

    console.log('\n✨ Successfully updated telegram_channel name!');
    console.log(`   Old: [long description string]`);
    console.log(`   New: ${CORRECT_CHANNEL_NAME}`);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }

  process.exit(0);
}

fixTelegramChannel();
