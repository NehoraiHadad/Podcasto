# Podcasto Troubleshooting Guide

## Table of Contents

- [Podcast Format Issues](#podcast-format-issues)
- [Episode Generation Issues](#episode-generation-issues)
- [Audio Quality Issues](#audio-quality-issues)
- [Database Issues](#database-issues)
- [Lambda Function Issues](#lambda-function-issues)
- [Email Notification Issues](#email-notification-issues)
- [Common Error Messages](#common-error-messages)

---

## Podcast Format Issues

### Problem: Audio has multiple voices instead of one (Single-Speaker)

**Symptoms:**
- Created single-speaker podcast but episodes have two voices
- Audio sounds like a dialogue instead of narration

**Possible Causes:**
1. `podcast_format` not set correctly in database
2. Format not passed through SQS message chain
3. Lambda using wrong TTS configuration

**Solution:**

1. **Check Database:**
```sql
SELECT id, podcast_name, podcast_format, speaker1_role, speaker2_role
FROM podcast_configs
WHERE podcast_id = 'your-podcast-id';
```
Expected: `podcast_format = 'single-speaker'` and `speaker2_role IS NULL`

2. **Check Episode Metadata:**
```sql
SELECT id, metadata->>'podcast_format' as format
FROM episodes
WHERE podcast_id = 'your-podcast-id'
ORDER BY created_at DESC
LIMIT 1;
```

3. **Check Lambda Logs:**
```bash
# Search CloudWatch Logs
aws logs filter-log-events \
  --log-group-name /aws/lambda/audio-generation-{env} \
  --filter-pattern "podcast_format" \
  --start-time $(date -u -d '1 hour ago' +%s)000
```

4. **Fix if Needed:**
```typescript
// Update podcast format via admin panel
await updatePodcastConfig(podcastId, {
  podcastFormat: 'single-speaker',
  speaker1Role: 'Narrator'
  // speaker2Role will be automatically cleared
});
```

---

### Problem: Cannot create podcast without speaker2_role (Single-Speaker)

**Symptoms:**
- Form validation error requiring speaker2_role
- Cannot submit single-speaker podcast

**Possible Causes:**
1. Format not selected as 'single-speaker' in UI
2. UI not hiding speaker2 field
3. Validation schema issue

**Solution:**

1. **Verify Format Selection:**
   - In podcast creation form, ensure "Single-Speaker" is selected
   - Verify speaker2 field is hidden/disabled

2. **Check Browser Console:**
   - Open developer tools (F12)
   - Look for JavaScript errors
   - Verify form state

3. **Check Validation:**
```typescript
// Form should submit with:
{
  podcastFormat: "single-speaker",
  speaker1Role: "Narrator",
  // speaker2Role: undefined or omitted
}
```

4. **Clear Browser Cache:**
   - Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
   - Clear site data
   - Try in incognito mode

---

### Problem: Format changed but old episodes still have wrong format

**Symptoms:**
- Updated podcast format but existing episodes sound wrong
- Inconsistent audio styles across episodes

**Explanation:**
This is expected behavior. Format changes only apply to new episodes.

**Solution:**

1. **Cannot Change Format Retroactively:**
   - Existing episodes retain their original format
   - Voice consistency is important for user experience

2. **Options:**
   - Delete old episodes and regenerate (if needed)
   - Create new podcast with desired format
   - Keep both podcasts for different content styles

3. **Best Practice:**
   - Test format with 1-2 episodes before mass generation
   - Choose format carefully during setup

---

### Problem: Multi-speaker podcast sounds like one voice

**Symptoms:**
- Created multi-speaker podcast but only one voice
- No conversation, just narration

**Possible Causes:**
1. Format set to single-speaker by mistake
2. speaker2_role is NULL in database
3. Script generation didn't create dialogue

**Solution:**

1. **Check Configuration:**
```sql
SELECT podcast_format, speaker1_role, speaker2_role
FROM podcast_configs
WHERE podcast_id = 'your-podcast-id';
```
Expected: `podcast_format = 'multi-speaker'` and `speaker2_role IS NOT NULL`

2. **Check Script Content:**
   - Look at episode script in S3
   - Should have "Host:" and "Expert:" prefixes
   - If narration only, script generation issue

3. **Regenerate Episode:**
   - Delete problematic episode
   - Verify podcast format is correct
   - Generate new episode

---

## Episode Generation Issues

### Problem: Episode stuck in "pending" status

**Symptoms:**
- Episode created but never progresses
- Status remains "pending" for hours

**Possible Causes:**
1. Lambda not triggered
2. SQS queue backlog
3. Lambda execution failure

**Solution:**

1. **Check SQS Queue:**
```bash
aws sqs get-queue-attributes \
  --queue-url "your-queue-url" \
  --attribute-names ApproximateNumberOfMessages
```

2. **Check Lambda Logs:**
```bash
# Telegram Lambda
aws logs tail /aws/lambda/telegram-{env} --follow

# Look for episode_id in logs
aws logs filter-log-events \
  --log-group-name /aws/lambda/telegram-{env} \
  --filter-pattern "episode-id-here"
```

3. **Manual Retry:**
   - Admin panel → Find episode
   - Click "Retry Generation"
   - Monitor status

4. **Check DLQ (Dead Letter Queue):**
```bash
aws sqs receive-message \
  --queue-url "your-dlq-url" \
  --max-number-of-messages 10
```

---

### Problem: Episode failed with "No messages found"

**Symptoms:**
- Episode status: "failed_no_messages"
- Error: "No new messages in channel"

**Possible Causes:**
1. Telegram channel has no activity in time range
2. Time range too short
3. Channel name incorrect
4. Channel not accessible

**Solution:**

1. **Verify Channel Activity:**
   - Open Telegram and check channel manually
   - Confirm messages exist in specified time range

2. **Extend Time Range:**
   - Admin panel → Edit podcast
   - Increase "Telegram Hours" (e.g., from 24 to 48)
   - Retry generation

3. **Check Channel Name:**
```typescript
// Format should be one of:
"@channelname"
"https://t.me/channelname"
"channelname"
```

4. **Verify Access:**
   - Ensure channel is public or bot has access
   - Check Telegram bot credentials in Lambda

---

### Problem: Episode failed during script generation

**Symptoms:**
- Episode progresses past Telegram fetch
- Fails at script generation stage
- Error mentions "Gemini API" or "script generation"

**Possible Causes:**
1. Gemini API rate limit
2. Invalid API key
3. Script too long/complex
4. Content filtering

**Solution:**

1. **Check Lambda Logs:**
```bash
aws logs tail /aws/lambda/script-preprocessor-{env} --follow
```

2. **Check API Key:**
```bash
aws secretsmanager get-secret-value \
  --secret-id podcasto-secrets
```

3. **Wait and Retry:**
   - Rate limits reset after time
   - Retry episode generation in 5-10 minutes

4. **Reduce Complexity:**
   - Lower creativity level (60-70 instead of 80-90)
   - Reduce time range to get fewer messages
   - Simplify additional instructions

---

### Problem: Episode failed during audio generation

**Symptoms:**
- Script generated successfully
- Fails at audio generation stage
- Error mentions "TTS" or "audio"

**Possible Causes:**
1. TTS API timeout
2. Invalid voice configuration
3. Script too long
4. Lambda timeout

**Solution:**

1. **Check Lambda Timeout:**
```bash
aws lambda get-function-configuration \
  --function-name audio-generation-{env} \
  | grep Timeout
```
Should be 900 seconds (15 minutes)

2. **Check Logs:**
```bash
aws logs tail /aws/lambda/audio-generation-{env} --follow
```

3. **Voice Configuration:**
```sql
SELECT speaker1_voice, speaker2_voice
FROM episodes
WHERE id = 'episode-id';
```

4. **Retry with Timeout Buffer:**
   - Episode automatically retried via SQS
   - Check episode status after 15-20 minutes

---

## Audio Quality Issues

### Problem: Audio is choppy or has gaps

**Symptoms:**
- Audio cuts in and out
- Silence between words
- Unnatural pauses

**Possible Causes:**
1. Chunk concatenation issue
2. Network problem during generation
3. TTS API glitch

**Solution:**

1. **Regenerate Episode:**
   - Delete episode
   - Generate fresh episode
   - Usually resolves transient issues

2. **Check Mixing Techniques:**
   - Admin panel → Edit podcast
   - Ensure "normalization" is enabled
   - Add "compression" if available

3. **Reduce Chunk Size:**
   - Contact admin to adjust chunk size in Lambda config
   - Smaller chunks = better concatenation

---

### Problem: Voice sounds robotic or unnatural

**Symptoms:**
- Flat, monotone voice
- Lack of emotion
- Sounds like text-to-speech

**Possible Causes:**
1. Creativity level too low
2. Script lacks natural language
3. Voice selection doesn't match content

**Solution:**

1. **Increase Creativity:**
   - Admin panel → Edit podcast
   - Increase creativity level to 70-80
   - Regenerate episode

2. **Improve Script Instructions:**
   - Add to "Additional Instructions":
   ```
   Use natural, conversational language.
   Include emotional expressions and emphasis.
   Vary sentence structure and pacing.
   ```

3. **Content Type Matters:**
   - News: 40-60 creativity (factual)
   - Entertainment: 70-90 creativity (engaging)
   - Educational: 60-75 creativity (balanced)

---

### Problem: Volume inconsistent throughout episode

**Symptoms:**
- Some parts too loud, others too quiet
- Hard to hear certain sections
- Need to adjust volume frequently

**Solution:**

1. **Enable Normalization:**
   - Admin panel → Edit podcast
   - Ensure "normalization" mixing technique is enabled

2. **Add Compression:**
   - Add "compression" to mixing techniques
   - Helps even out volume levels

3. **Regenerate Episode:**
   - Changes only apply to new episodes
   - Delete and regenerate problematic episode

---

## Database Issues

### Problem: Cannot query podcast_format field

**Symptoms:**
- SQL error: "column does not exist"
- TypeScript error: Property 'podcast_format' does not exist

**Solution:**

1. **Run Migration:**
```bash
cd podcasto
npx drizzle-kit generate
npx drizzle-kit push
```

2. **Verify Column Exists:**
```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'podcast_configs'
AND column_name = 'podcast_format';
```

3. **Check Drizzle Schema:**
```typescript
// src/lib/db/schema/podcast-configs.ts
export const podcastConfigs = pgTable('podcast_configs', {
  // ... other fields
  podcast_format: text('podcast_format').default('multi-speaker'),
  // ... other fields
});
```

---

### Problem: Existing podcasts missing podcast_format value

**Symptoms:**
- Queries return NULL for podcast_format
- Old podcasts don't have format set

**Solution:**

1. **Apply Default:**
```sql
UPDATE podcast_configs
SET podcast_format = 'multi-speaker'
WHERE podcast_format IS NULL;
```

2. **Verify:**
```sql
SELECT COUNT(*) as count, podcast_format
FROM podcast_configs
GROUP BY podcast_format;
```

---

## Lambda Function Issues

### Problem: Lambda timeout (15 minutes exceeded)

**Symptoms:**
- Episode fails after exactly 15 minutes
- Error: "Task timed out after 900.00 seconds"

**Possible Causes:**
1. Script too long
2. TTS API slow response
3. Chunk processing too slow

**Solution:**

1. **Reduce Script Length:**
   - Decrease Telegram hours
   - Set stricter message filters
   - Reduce time range

2. **Check TTS API Status:**
   - Google Cloud Status Dashboard
   - Try again later if degraded performance

3. **Monitor Chunk Processing:**
```bash
# Check logs for chunk timing
aws logs filter-log-events \
  --log-group-name /aws/lambda/audio-generation-{env} \
  --filter-pattern "chunk.*duration"
```

---

### Problem: Lambda out of memory

**Symptoms:**
- Error: "Runtime exited with error: signal: killed"
- Episode fails during processing

**Solution:**

1. **Check Memory Configuration:**
```bash
aws lambda get-function-configuration \
  --function-name audio-generation-{env} \
  | grep MemorySize
```
Should be 2048 MB or higher

2. **Increase Memory:**
```bash
aws lambda update-function-configuration \
  --function-name audio-generation-{env} \
  --memory-size 3008
```

---

### Problem: Format not flowing through Lambda chain

**Symptoms:**
- Format correct in database
- Audio still wrong format
- Logs show missing format

**Solution:**

1. **Verify Each Stage:**

**Telegram Lambda:**
```bash
aws logs filter-log-events \
  --log-group-name /aws/lambda/telegram-{env} \
  --filter-pattern "[TELEGRAM_LAMBDA] podcast_format"
```

**Script Preprocessor:**
```bash
aws logs filter-log-events \
  --log-group-name /aws/lambda/script-preprocessor-{env} \
  --filter-pattern "[SCRIPT_PREP] podcast_format"
```

**Audio Generation:**
```bash
aws logs filter-log-events \
  --log-group-name /aws/lambda/audio-generation-{env} \
  --filter-pattern "[AUDIO_GEN] podcast_format"
```

2. **Check SQS Message:**
```bash
# View messages in queue
aws sqs receive-message \
  --queue-url "your-queue-url" \
  --attribute-names All \
  --message-attribute-names All
```

3. **Redeploy Lambdas:**
```bash
cd Lambda/telegram-lambda && ./deploy.sh dev
cd ../script-preprocessor-lambda && ./deploy.sh dev
cd ../audio-generation-lambda && ./deploy.sh dev
```

---

## Email Notification Issues

### Problem: Not receiving episode notifications

**Symptoms:**
- Episode completed but no email received
- Other users receive emails

**Solution:**

1. **Check Email Preferences:**
   - Profile page → Email Notifications
   - Ensure toggle is ON

2. **Verify Subscription:**
```sql
SELECT * FROM subscriptions
WHERE user_id = 'your-user-id'
AND podcast_id = 'podcast-id';
```

3. **Check Sent Episodes:**
```sql
SELECT * FROM sent_episodes
WHERE user_id = 'your-user-id'
AND episode_id = 'episode-id';
```
If exists, email already sent (duplicate prevention)

4. **Check Spam Folder:**
   - AWS SES emails may be flagged
   - Add sender to contacts

---

### Problem: Emails not being sent at all

**Symptoms:**
- No users receiving notifications
- sent_episodes table empty

**Solution:**

1. **Check SES Configuration:**
```bash
aws ses get-account-sending-enabled
```

2. **Verify Email Address:**
```bash
aws ses list-verified-email-addresses
```

3. **Check SES Sandbox:**
   - If in sandbox, only verified emails can receive
   - Request production access from AWS

4. **Review Lambda Logs:**
```bash
# Check email sending logs
aws logs filter-log-events \
  --log-group-name /aws/lambda/audio-generation-{env} \
  --filter-pattern "email"
```

---

## Common Error Messages

### "Speaker 2 role is required for multi-speaker podcasts"

**Cause:** Trying to create/update multi-speaker podcast without speaker2_role

**Fix:** Provide speaker2_role value or change format to single-speaker

---

### "Validation error: Invalid enum value"

**Cause:** podcast_format has invalid value (not 'single-speaker' or 'multi-speaker')

**Fix:** Use only valid format values in API calls

---

### "Access Denied: User is not authorized to perform s3:PutObject"

**Cause:** IAM permissions missing for S3

**Fix:** Update IAM policy to include s3:PutObject permission

---

### "No new messages in channel for specified time range"

**Cause:** Telegram channel has no activity

**Fix:** Extend time range or verify channel is active

---

### "Gemini API rate limit exceeded"

**Cause:** Too many requests to Gemini API

**Fix:** Wait 5-10 minutes and retry

---

### "Episode already processing"

**Cause:** Episode generation triggered twice

**Fix:** Wait for current generation to complete or cancel first

---

## Debug Checklist

When troubleshooting podcast format issues, check:

- [ ] Database: podcast_format field correct?
- [ ] Database: speaker2_role NULL for single-speaker?
- [ ] UI: Format selection reflected in form?
- [ ] Server Action: Format included in request?
- [ ] SQS Message: Format in message body?
- [ ] Lambda Logs: Format logged at each stage?
- [ ] TTS Config: Correct voice configuration used?
- [ ] Episode Metadata: Format stored in episode?

---

## Getting Help

**Documentation:**
- [User Guide](USER_GUIDE.md) - Complete usage guide
- [Podcast Formats](PODCAST_FORMATS.md) - Format comparison
- [API Documentation](API_DOCUMENTATION.md) - Technical reference
- [CLAUDE.md](../CLAUDE.md) - Architecture details

**Admin Tools:**
- Admin Panel: Monitor episodes and logs
- CloudWatch Logs: Detailed Lambda execution logs
- Database Queries: Direct data inspection
- SQS Console: Message queue monitoring

**Support Escalation:**
1. Check relevant section in this guide
2. Review CloudWatch logs for errors
3. Check episode error message in admin panel
4. Contact development team with:
   - Episode ID
   - Podcast ID
   - Error message
   - CloudWatch log excerpts
   - Steps to reproduce

---

**Most issues can be resolved by checking logs and verifying configuration. Always start with the basics before escalating!**
