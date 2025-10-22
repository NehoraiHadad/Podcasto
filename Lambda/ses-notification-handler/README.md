# SES Notification Handler Lambda

AWS Lambda function that processes bounce and complaint notifications from AWS SES via SNS topics.

## Purpose

Automatically handles email delivery failures and spam complaints by:
1. Recording bounce/complaint events in the `email_bounces` table
2. Disabling email notifications for affected users in the `profiles` table
3. Preventing future delivery attempts to problematic addresses

## Architecture

```
SES Email Bounce/Complaint
    ↓
SNS Topic (podcasto-ses-bounces / podcasto-ses-complaints)
    ↓
Lambda Function (ses-notification-handler)
    ↓
Supabase Database
    ├── INSERT into email_bounces (log event)
    └── UPDATE profiles SET email_notifications = false
```

## Bounce Types

### Hard Bounces (Permanent)
- **General**: Invalid email address
- **NoEmail**: Email address doesn't exist
- **Suppressed**: Email is on suppression list
- **Action**: Immediately disable email_notifications

### Soft Bounces (Transient)
- **General**: Temporary delivery failure
- **MailboxFull**: Recipient mailbox is full
- **MessageTooLarge**: Email exceeds size limit
- **Action**: Log only, no user action

## Complaint Handling

When a user marks an email as spam:
1. Record complaint in `email_bounces`
2. Immediately disable `email_notifications` for the user
3. Comply with CAN-SPAM Act requirements

## Deployment

### Prerequisites
- AWS CLI configured with appropriate credentials
- SAM CLI installed (`pip install aws-sam-cli`)
- Supabase database credentials

### Deploy

```bash
cd Lambda/ses-notification-handler
./deploy.sh prod
```

You'll be prompted for:
- DB Host: `db.xxxxx.supabase.co`
- DB Password: Supabase postgres password

### Verify Deployment

```bash
# Check function exists
aws lambda get-function --function-name ses-notification-handler-prod --region us-east-1

# Check SNS subscriptions
aws sns list-subscriptions-by-topic \
  --topic-arn arn:aws:sns:us-east-1:638520701769:podcasto-ses-bounces
```

## Testing

### Test Bounce Handling

AWS provides special email addresses for testing:

```bash
# Test hard bounce
aws ses send-email \
  --from notifications@podcasto.org \
  --destination ToAddresses=bounce@simulator.amazonses.com \
  --message Subject={Data="Test Bounce"},Body={Text={Data="Testing"}} \
  --region us-east-1
```

### Test Complaint Handling

```bash
# Test complaint
aws ses send-email \
  --from notifications@podcasto.org \
  --destination ToAddresses=complaint@simulator.amazonses.com \
  --message Subject={Data="Test Complaint"},Body={Text={Data="Testing"}} \
  --region us-east-1
```

### Check Logs

```bash
# View CloudWatch logs
aws logs tail /aws/lambda/ses-notification-handler-prod --follow --region us-east-1
```

### Verify Database

```sql
-- Check bounce records
SELECT * FROM email_bounces ORDER BY created_at DESC LIMIT 10;

-- Check disabled users
SELECT id, email_notifications, unsubscribe_token
FROM profiles
WHERE email_notifications = false
ORDER BY updated_at DESC;
```

## Monitoring

### Key Metrics
- **Bounce Rate**: Track in `email_bounces` table
- **Complaint Rate**: Should be < 0.1% to maintain SES reputation
- **Lambda Errors**: Monitor CloudWatch for processing failures

### Queries

```sql
-- Bounce rate (last 30 days)
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
WHERE event_type = 'bounce'
  AND created_at > NOW() - INTERVAL '30 days'
GROUP BY bounce_type, sub_type
ORDER BY count DESC;
```

## Troubleshooting

### Lambda not triggering
1. Check SNS topic subscriptions: `aws sns list-subscriptions`
2. Verify SES notifications are configured: `aws ses get-identity-notification-attributes --identities podcasto.org`

### Database connection failures
1. Check DB_HOST, DB_USER, DB_PASSWORD in Lambda environment variables
2. Ensure Supabase allows connections from AWS Lambda IPs
3. Check CloudWatch logs for connection errors

### Users still receiving emails after bounce
1. Verify `profiles.email_notifications` was set to `false`
2. Check `email_bounces` table has the bounce record
3. Ensure email sending logic checks `email_notifications` flag

## Security

- Database credentials stored in Lambda environment variables (encrypted at rest)
- No public API exposure (triggered only by SNS)
- Minimal IAM permissions (SNS + CloudWatch Logs only)

## Cost

- **Lambda**: ~$0.20 per 1M requests
- **SNS**: ~$0.50 per 1M notifications
- **Expected**: < $1/month for typical bounce/complaint rates

## Related Documentation

- [AWS SES Best Practices](https://docs.aws.amazon.com/ses/latest/dg/best-practices.html)
- [EMAIL_SETUP.md](/podcasto/EMAIL_SETUP.md)
- [Bounce Handling Guide](https://docs.aws.amazon.com/ses/latest/dg/notification-contents.html#bounce-object)
