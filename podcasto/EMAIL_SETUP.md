# Email Notification Setup Guide

This guide explains how to set up AWS SES for sending email notifications in Podcasto.

## Prerequisites

- AWS account with SES access
- Domain verified in AWS SES (podcasto.org)
- IAM user with programmatic access

## Setup Steps

### 1. Verify Domain in AWS SES

1. Go to AWS SES Console → Verified identities
2. Click "Create identity"
3. Select "Domain" and enter: `podcasto.org`
4. Follow DNS verification steps
5. Wait for verification (can take up to 72 hours)

### 2. Verify Email Address

1. In SES Console → Verified identities
2. Click "Create identity"
3. Select "Email address" and enter: `notifications@podcasto.org`
4. Check email and click verification link

### 3. Request Production Access

**Important:** By default, SES is in **sandbox mode** with strict limits:
- 1 email per second
- 200 emails per day
- Can only send to verified email addresses

To send to all subscribers:

1. Go to AWS SES Console
2. Click "Account dashboard" → "Request production access"
3. Fill out the form explaining your use case
4. Wait for approval (usually 24-48 hours)

### 4. Configure IAM Permissions

Run the provided script to set up IAM permissions:

```bash
cd podcasto
./scripts/setup-ses-permissions.sh
```

This creates/updates the `PodcastoSESSendOnly` policy with:
- `ses:SendEmail`
- `ses:SendRawEmail`
- `ses:SendTemplatedEmail`
- `ses:SendBulkTemplatedEmail`

All restricted to sending from: `notifications@podcasto.org`

### 5. Create SES Email Template

Run the template creation script:

```bash
cd podcasto
./scripts/create-ses-template.sh
```

This creates the `podcasto-new-episode-v1` template in AWS SES.

### 6. Configure Environment Variables

Add to your `.env.local` or Vercel environment:

```bash
# AWS SES Configuration
AWS_SES_REGION=us-east-1
AWS_SES_FROM_EMAIL=notifications@podcasto.org
AWS_SES_FROM_NAME=Podcasto

# Set to true if in sandbox mode, false for production
AWS_SES_SANDBOX=false

# AWS Credentials (same as S3)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key
```

### 7. Test Email Sending

1. Go to Admin Dashboard → Episodes
2. Select a published episode
3. Click "..." menu → "Send Email Notifications"
4. Verify email is received

## Monitoring

### Check SES Sending Statistics

```bash
aws ses get-send-statistics --region us-east-1
```

### View Bounce/Complaint Rates

```bash
aws ses get-account-sending-enabled --region us-east-1
```

### List Email Templates

```bash
aws ses list-templates --region us-east-1
```

## Troubleshooting

### "Email address not verified" Error

**Solution:** Verify `notifications@podcasto.org` in SES Console.

### "Daily sending quota exceeded"

**Solution:** Request production access or wait 24 hours for quota reset.

### "AccessDenied" Error

**Solution:** Run `./scripts/setup-ses-permissions.sh` to update IAM permissions.

### "Template not found" Error

**Solution:** Run `./scripts/create-ses-template.sh` to create the template.

## Rate Limits

### Sandbox Mode
- **Send rate:** 1 email/second
- **Daily quota:** 200 emails/day
- **Recipients:** Only verified addresses

### Production Mode
- **Send rate:** 14 emails/second (can request increase)
- **Daily quota:** 50,000 emails/day (can request increase)
- **Recipients:** Any valid email address

## Costs

AWS SES Pricing (as of 2025):
- **First 62,000 emails/month:** FREE (via AWS Free Tier)
- **After that:** $0.10 per 1,000 emails

Example costs:
- 1,000 subscribers = 1,000 emails/episode = FREE
- 10,000 subscribers = 10,000 emails/episode = FREE
- 100,000 subscribers = 100,000 emails/episode = ~$3.80/episode

## Architecture

### Email Flow

1. Episode status changes to `published`
2. Episode processor triggers `sendNewEpisodeNotification()`
3. Fetch all subscribers for podcast
4. Batch users into groups of 50
5. Send bulk templated emails via `SendBulkTemplatedEmailCommand`
6. Record sent emails in `sent_episodes` table
7. Respect rate limits and daily quotas

### Bulk Sending Benefits

- **50x fewer API calls** (50 recipients per call vs 1)
- **Faster delivery** (batched processing)
- **Lower cost** (fewer HTTP requests)
- **Built-in personalization** (Handlebars templates)

## Security

- IAM policy restricts sending to `notifications@podcasto.org` only
- No access to read emails or access other SES features
- Credentials stored securely in environment variables
- Template stored in AWS (not in code)

## Maintenance

### Update Email Template

Edit `src/lib/email/templates/ses-templates.ts`, then:

```bash
./scripts/create-ses-template.sh
```

This will update the existing template in AWS SES.

### Update IAM Permissions

Edit `scripts/setup-ses-permissions.sh`, then:

```bash
./scripts/setup-ses-permissions.sh
```

This will create a new version of the IAM policy.

## Support

For issues with:
- **Verification:** Check AWS SES Console → Verified identities
- **Limits:** Check AWS SES Console → Account dashboard
- **Delivery:** Check AWS SES Console → Sending statistics
- **Code:** Check application logs in Vercel

## References

- [AWS SES Documentation](https://docs.aws.amazon.com/ses/)
- [AWS SES API Reference](https://docs.aws.amazon.com/ses/latest/APIReference/)
- [Handlebars Template Syntax](https://handlebarsjs.com/guide/)
