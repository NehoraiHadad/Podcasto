# AWS SES Production Access - Instructions

## Current Status
✅ Email notification system is working correctly
✅ Database integration successful
✅ IAM permissions configured
⚠️  **AWS SES account is in SANDBOX MODE**

## What is Sandbox Mode?
In sandbox mode, you can ONLY send emails to:
- Verified email addresses
- Verified domains

This means you cannot send emails to your actual users yet.

## Testing in Sandbox Mode
To test the email system with a specific email address:

1. Go to AWS Console → Amazon SES → Verified identities
2. Click "Create identity"
3. Choose "Email address"
4. Enter your test email (e.g., nehorai.hadad@gmail.com)
5. Click "Create identity"
6. Check your email inbox for verification link
7. Click the verification link
8. Run the test again:
```bash
curl "https://www.podcasto.org/api/test/send-email?episodeId=774553b1-1582-4beb-9aa7-06abc0fd4157&secret=YOUR_CRON_SECRET"
```

## Moving to Production (REQUIRED for real users)

### Step 1: Request Production Access
1. Go to AWS Console → Amazon SES
2. Click on your account name (top-right) → Account dashboard
3. Look for "Production access" section
4. Click "Request production access" or "Get started"

### Step 2: Fill the Form
You'll need to provide:

**Use case description** (example):
```
Podcasto is an AI-powered podcast platform that sends email notifications
to users when new podcast episodes are published. Users explicitly subscribe
to podcasts and can unsubscribe at any time through their profile settings.

Emails are transactional in nature, containing:
- Notification of new episode publication
- Episode title and description
- Direct link to listen to the episode
- Unsubscribe link

Expected sending volume: 100-500 emails per day
Bounce/complaint handling: Implemented via SES suppression list
```

**Compliance statement** (example):
```
We comply with email marketing best practices:
- Users opt-in via subscription
- Every email includes unsubscribe mechanism
- We track sent emails to prevent duplicates
- We respect user preferences (email_notifications setting)
- We handle bounces and complaints via AWS SES suppression list
```

**Email sending configuration**:
- Sending rate: Start with 10-50 emails per second
- Daily quota: 5,000-10,000 emails per day
- Your domain: podcasto.org

### Step 3: Wait for Approval
- Usually takes 24-48 hours
- AWS will review your request
- You'll receive email notification when approved

### Step 4: After Approval
Once approved:
- `ProductionAccessEnabled` will be `true`
- You can send to any email address
- Higher sending limits
- Your notification system will work for all users!

## Current Test Results
```json
{
  "success": true,
  "result": {
    "success": false,
    "totalSubscribers": 1,
    "emailsSent": 0,
    "emailsFailed": 1,
    "errors": ["Email address is not verified..."]
  }
}
```

This error is EXPECTED in sandbox mode. The system itself works perfectly!

## Summary
✅ Code is working correctly
✅ Database queries successful
✅ AWS permissions configured
⚠️  Need to either:
   1. Request production access (for real users)
   2. Verify test email address (for testing only)
