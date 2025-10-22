# Email Notification System Setup Guide

Complete guide for setting up AWS SES email notifications in Podcasto.

## Table of Contents
- [Overview](#overview)
- [Architecture](#architecture)
- [AWS SES Setup](#aws-ses-setup)
- [Unsubscribe System](#unsubscribe-system)
- [Environment Variables](#environment-variables)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)

---

## Overview

Podcasto uses AWS SES (Simple Email Service) for sending email notifications when new podcast episodes are published. The system includes:

- ✅ Bulk email sending (up to 50 recipients per API call)
- ✅ Email templates with Handlebars syntax
- ✅ Rate limiting (respects AWS SES limits)
- ✅ Duplicate prevention (tracks sent emails)
- ✅ User preference management
- ✅ One-click unsubscribe system
- ✅ Settings page for managing notifications

---

## Architecture

### Email Flow
1. Episode status changes to `PUBLISHED`
2. System fetches subscribers for the podcast
3. Checks user preferences (`email_notifications = true`)
4. Generates unsubscribe tokens if missing
5. Sends emails in batches of 50 using `SendBulkTemplatedEmail`
6. Records sent emails to prevent duplicates

### Database Schema

#### `profiles` Table
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY,
  email_notifications BOOLEAN DEFAULT TRUE,
  unsubscribe_token UUID UNIQUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### `sent_episodes` Table
```sql
CREATE TABLE sent_episodes (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  episode_id UUID NOT NULL,
  sent_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, episode_id)
);
```

---

## AWS SES Setup

### 1. Domain Verification

Verify your domain in AWS SES:

```bash
# Replace with your domain
DOMAIN="podcasto.org"

# Request verification
aws ses verify-domain-identity --domain $DOMAIN --region us-east-1
```

Add the TXT record provided by AWS to your DNS settings.

### 2. Email Address Verification (Sandbox Mode)

While in sandbox mode, verify all recipient email addresses:

```bash
aws ses verify-email-identity --email-address your-email@example.com --region us-east-1
```

### 3. Request Production Access

To send emails to unverified addresses and increase sending limits:

1. Go to AWS SES Console → Account Dashboard
2. Click "Request production access"
3. Provide use case details (podcast notifications)
4. Expected sending volume
5. Wait for approval (usually 24-48 hours)

### 4. IAM Permissions

Create IAM policy for SES sending:

```bash
./scripts/setup-ses-permissions.sh
```

Required permissions:
- `ses:SendEmail`
- `ses:SendRawEmail`
- `ses:SendTemplatedEmail`
- `ses:SendBulkTemplatedEmail`

### 5. Create SES Template

Run the template creation script:

```bash
./scripts/create-ses-template.sh
```

This creates the `podcasto-new-episode-v1` template in AWS SES.

---

## Unsubscribe System

### How It Works

1. **Token Generation**: Each user gets a unique UUID token stored in `profiles.unsubscribe_token`
2. **Lazy Creation**: Tokens are generated automatically when first email is sent
3. **Email Footer**: Every email includes:
   - Settings link: `/settings/notifications` (manage preferences)
   - Unsubscribe link: `/unsubscribe?token={uuid}` (one-click unsubscribe)

### Routes

#### `/settings/notifications`
- Protected route (requires authentication)
- Toggle email notifications ON/OFF
- Shows current user email
- Uses `toggleEmailNotifications` server action

#### `/unsubscribe?token={uuid}`
- Public route (no authentication required)
- Validates token and sets `email_notifications = false`
- Shows success/error message
- Links to login and homepage

### Security

- Tokens are UUIDs (128-bit, cryptographically random)
- Tokens are unique per user
- No authentication required for unsubscribe (industry standard)
- Idempotent operation (safe to use same token multiple times)

### Legal Compliance

The unsubscribe system ensures compliance with:
- **CAN-SPAM Act** (US): Requires clear unsubscribe mechanism
- **GDPR** (EU): Right to opt-out of marketing communications

---

## Environment Variables

### Required Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxxx
SUPABASE_SERVICE_ROLE_KEY=xxxxx
DATABASE_URL=postgresql://postgres:[PASSWORD]@xxxxx

# AWS SES
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=xxxxx
AWS_SECRET_ACCESS_KEY=xxxxx
AWS_SES_REGION=us-east-1
AWS_SES_FROM_EMAIL=notifications@podcasto.org
AWS_SES_FROM_NAME=Podcasto

# AWS SES Sandbox Mode (IMPORTANT!)
AWS_SES_SANDBOX=true  # Set to false only after production approval

# Site URL (for email links)
NEXT_PUBLIC_SITE_URL=https://podcasto.org
```

### Setting Environment Variables in Vercel

1. Go to Vercel Dashboard → Your Project → Settings
2. Click "Environment Variables"
3. Add each variable with appropriate scope:
   - Production
   - Preview
   - Development
4. Redeploy after adding variables

### Critical: AWS_SES_SANDBOX

**Must set `AWS_SES_SANDBOX=true` until AWS approves production access!**

Sandbox mode:
- 1 email per second
- 200 emails per day
- Only verified email addresses

Production mode:
- 14 emails per second
- 50,000 emails per day
- Any email address

If not set, code defaults to production limits and will hit rate limit errors in sandbox.

---

## Testing

### 1. Database Verification

Check if migration applied:

```sql
-- Via Supabase SQL Editor or MCP
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'profiles' AND column_name = 'unsubscribe_token';
```

Expected result:
```
column_name       | data_type
unsubscribe_token | uuid
```

### 2. Settings Page Test

1. Log in to application
2. Navigate to `/settings/notifications`
3. Toggle email notifications OFF
4. Check database:
```sql
SELECT email_notifications FROM profiles WHERE id = '{user_id}';
```
5. Toggle back ON and verify

### 3. Email Sending Test

Using admin "Send Email Notifications" button:

1. Go to Admin panel → Episodes
2. Find a PUBLISHED episode with subscribers
3. Click "..." menu → "Send Email Notifications"
4. Check email inbox (must be verified in sandbox mode)
5. Verify email contains:
   - Correct episode details
   - "Manage your subscriptions" → `/settings/notifications`
   - "Unsubscribe" → `/unsubscribe?token={uuid}`

### 4. Unsubscribe Flow Test

1. Click "Unsubscribe" link in email
2. Verify success message shows
3. Check database:
```sql
SELECT email_notifications, unsubscribe_token
FROM profiles
WHERE unsubscribe_token = '{token_from_url}';
```
4. Try unsubscribing again with same token (should still work)

### 5. Token Generation Test

Check token is created automatically:

```sql
-- Before sending first email to new user
SELECT unsubscribe_token FROM profiles WHERE id = '{new_user_id}';
-- Should be NULL

-- Send email via admin button

-- After email sent
SELECT unsubscribe_token FROM profiles WHERE id = '{new_user_id}';
-- Should have UUID value
```

---

## Troubleshooting

### Issue: Template name exceeds 64 characters

**Error**: `Template name <!DOCTYPE html>... exceeds maximum allowed length 64`

**Solution**: You're passing HTML content instead of template name. Use:
```typescript
Template: 'podcasto-new-episode-v1'  // Template name
```

Not:
```typescript
Template: NEW_EPISODE_HTML_TEMPLATE  // HTML content
```

### Issue: Permission denied for SendBulkTemplatedEmail

**Error**: `User is not authorized to perform 'ses:SendBulkTemplatedEmail'`

**Solution**: Update IAM policy to include all required permissions:
```bash
./scripts/setup-ses-permissions.sh
```

### Issue: Malformed array literal in SQL

**Error**: `malformed array literal: "uuid-string"`

**Solution**: Use proper parameterized queries:
```typescript
const userIdConditions = userIds.map(id => sql`${id}::uuid`);
WHERE u.id IN (${sql.join(userIdConditions, sql`, `)})
```

### Issue: Rate limit exceeded

**Error**: Emails failing after 200/day or more than 1/second

**Solution**: Set `AWS_SES_SANDBOX=true` in Vercel until production approved.

### Issue: Unsubscribe link not working

**Checklist**:
1. ✅ Token exists in database for user
2. ✅ `NEXT_PUBLIC_SITE_URL` is set correctly
3. ✅ URL format: `/unsubscribe?token={uuid}`
4. ✅ Token is valid UUID format
5. ✅ User exists in profiles table

Debug:
```sql
-- Check token
SELECT id, unsubscribe_token FROM profiles WHERE unsubscribe_token = '{token}';

-- Check if user was unsubscribed
SELECT email_notifications FROM profiles WHERE unsubscribe_token = '{token}';
```

### Issue: Settings page not accessible

**Error**: Redirects to login immediately

**Solution**: Verify middleware protection allows `/settings` routes:
```typescript
// src/middleware.ts
const protectedRoutes = ['/profile', '/settings', '/admin'];
```

---

## Monitoring

### Key Metrics to Track

1. **Email Delivery Rate**
   - Sent vs Failed counts from `EmailNotificationResult`
   - Check CloudWatch logs for SES errors

2. **Unsubscribe Rate**
   - Query profiles with `email_notifications = false`
   - Track over time to identify issues

3. **Bounce Rate**
   - ✅ SNS topics configured for bounce notifications
   - ✅ Automatic disabling for hard bounces via Lambda
   - Query `email_bounces` table for bounce metrics

4. **Daily Send Volume**
   - Ensure staying within SES limits
   - Monitor via CloudWatch SES metrics

### Useful Queries

```sql
-- Total users with notifications enabled
SELECT COUNT(*) FROM profiles WHERE email_notifications = true;

-- Unsubscribe rate
SELECT
  COUNT(CASE WHEN email_notifications = false THEN 1 END)::float / COUNT(*) * 100 as unsubscribe_rate
FROM profiles;

-- Recently sent episodes
SELECT e.title, COUNT(se.id) as sent_count, se.sent_at
FROM sent_episodes se
JOIN episodes e ON e.id = se.episode_id
GROUP BY e.id, e.title, se.sent_at
ORDER BY se.sent_at DESC
LIMIT 10;

-- Users without tokens (need token generation)
SELECT COUNT(*) FROM profiles WHERE unsubscribe_token IS NULL;

-- Bounce and complaint metrics
SELECT
  event_type,
  COUNT(*) as count,
  COUNT(DISTINCT user_id) as unique_users
FROM email_bounces
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY event_type;

-- Hard bounce breakdown
SELECT
  bounce_type,
  sub_type,
  COUNT(*) as count
FROM email_bounces
WHERE event_type = 'bounce' AND created_at > NOW() - INTERVAL '30 days'
GROUP BY bounce_type, sub_type
ORDER BY count DESC;
```

---

## Bounce & Complaint Handling

### Overview

Podcasto automatically handles email delivery failures and spam complaints via AWS SES → SNS → Lambda integration:

1. **SES** sends bounce/complaint notifications → **SNS Topics**
2. **SNS** triggers **Lambda function** (`ses-notification-handler-prod`)
3. **Lambda** processes events and updates database

### Architecture

```
Email Bounce/Complaint
    ↓
AWS SES
    ↓
SNS Topics (podcasto-ses-bounces, podcasto-ses-complaints)
    ↓
Lambda (ses-notification-handler-prod)
    ↓
Supabase Database
    ├── INSERT into email_bounces (tracking)
    └── UPDATE profiles SET email_notifications = false (hard bounces & complaints)
```

### Configured Components

1. **SNS Topics**:
   - `arn:aws:sns:us-east-1:638520701769:podcasto-ses-bounces`
   - `arn:aws:sns:us-east-1:638520701769:podcasto-ses-complaints`

2. **Lambda Function**: `ses-notification-handler-prod`
   - **Location**: `/Lambda/ses-notification-handler/`
   - **Runtime**: Python 3.10
   - **Secrets**: Uses `podcasto-secrets` from AWS Secrets Manager

3. **Database Table**: `email_bounces`
   - Columns: `user_id`, `email`, `event_type`, `bounce_type`, `sub_type`, `raw_message`, `created_at`

### Bounce Types

| Type | Subtype | Action | Description |
|------|---------|--------|-------------|
| Permanent | General | Disable emails | Invalid email address |
| Permanent | NoEmail | Disable emails | Email address doesn't exist |
| Permanent | Suppressed | Disable emails | On SES suppression list |
| Transient | General | Log only | Temporary failure |
| Transient | MailboxFull | Log only | Recipient mailbox full |

### Complaint Handling

When a user marks an email as spam:
1. Event logged in `email_bounces` table
2. `profiles.email_notifications` set to `false` immediately
3. User will not receive future emails

### Testing

Test bounce handling:
```bash
aws ses send-email \
  --from notifications@podcasto.org \
  --destination ToAddresses=bounce@simulator.amazonses.com \
  --message 'Subject={Data="Test"},Body={Text={Data="Test"}}' \
  --region us-east-1
```

Test complaint handling:
```bash
aws ses send-email \
  --from notifications@podcasto.org \
  --destination ToAddresses=complaint@simulator.amazonses.com \
  --message 'Subject={Data="Test"},Body={Text={Data="Test"}}' \
  --region us-east-1
```

### Monitoring

Check Lambda logs:
```bash
aws logs tail /aws/lambda/ses-notification-handler-prod --follow --region us-east-1
```

Verify SNS subscriptions:
```bash
aws sns list-subscriptions-by-topic \
  --topic-arn arn:aws:sns:us-east-1:638520701769:podcasto-ses-bounces
```

### Troubleshooting

**Issue**: Lambda not receiving notifications
- Check SNS subscriptions are active
- Verify SES identity notification settings: `aws ses get-identity-notification-attributes --identities podcasto.org`

**Issue**: Users still receiving emails after bounce
- Check `profiles.email_notifications` was set to false
- Verify `email_bounces` table has the event
- Check Lambda logs for processing errors

---

## AWS SES Production Requirements

### Compliance (Required)

✅ **Out of Sandbox**: Approved for production (50,000 emails/day, 14 emails/second)

✅ **Bounce & Complaint Handling**: Implemented via SNS + Lambda
- Permanent bounces automatically disable email notifications
- Complaints immediately disable email notifications
- All events logged in `email_bounces` table

✅ **Unsubscribe Mechanism**: One-click unsubscribe in every email footer

✅ **Best Practices**:
- Only send to opted-in users (`email_notifications = true`)
- Duplicate prevention via `sent_episodes` table
- Rate limiting respects SES limits

### Future Enhancements

### Phase 2 (Recommended)
- [ ] Add `List-Unsubscribe` email header for email client support
- [ ] Per-podcast subscription controls

### Phase 3 (Optional)
- [ ] Email open rate tracking (privacy-conscious)
- [ ] Click-through rate tracking
- [ ] Admin dashboard for email analytics
- [ ] A/B testing for email templates
- [ ] Scheduled digest emails (weekly summary)

---

## Support

For issues or questions:
1. Check CloudWatch logs: `/aws/ses/email-sending`
2. Review Vercel function logs
3. Check Supabase logs for database errors
4. Verify SES template via AWS Console

---

**Last Updated**: 2025-10-22
**Version**: 2.0.0 (Production-ready with bounce/complaint handling)
