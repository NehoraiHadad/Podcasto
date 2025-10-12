#!/usr/bin/env node

/**
 * Test script for email notification system
 * Tests sending email for an existing episode
 */

import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Load environment variables
const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '.env.local') });

// Import the email notification function
async function testEmailNotification() {
  console.log('🧪 Testing Email Notification System...\n');

  // Episode ID to test with
  const episodeId = '774553b1-1582-4beb-9aa7-06abc0fd4157';

  console.log(`📧 Episode ID: ${episodeId}`);
  console.log(`🌐 Site URL: ${process.env.NEXT_PUBLIC_SITE_URL || 'not set'}`);
  console.log(`📬 SES From: ${process.env.AWS_SES_FROM_EMAIL || 'not set'}`);
  console.log(`🔑 AWS Region: ${process.env.AWS_REGION || 'not set'}\n`);

  try {
    // Dynamically import the notification service
    const { sendNewEpisodeNotification } = await import('./src/lib/services/email-notification.ts');

    console.log('📨 Sending email notification...\n');

    const result = await sendNewEpisodeNotification(episodeId);

    console.log('✅ Email notification completed!\n');
    console.log('📊 Results:');
    console.log(`   - Success: ${result.success}`);
    console.log(`   - Total Subscribers: ${result.totalSubscribers}`);
    console.log(`   - Emails Sent: ${result.emailsSent}`);
    console.log(`   - Emails Failed: ${result.emailsFailed}`);

    if (result.errors.length > 0) {
      console.log(`\n❌ Errors:`);
      result.errors.forEach((error, i) => {
        console.log(`   ${i + 1}. ${error}`);
      });
    }

    if (result.emailsSent > 0) {
      console.log('\n🎉 Success! Check the email inbox of the subscribed user.');
      console.log('   Also check the sent_episodes table in Supabase.');
    }

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

// Run the test
testEmailNotification();
