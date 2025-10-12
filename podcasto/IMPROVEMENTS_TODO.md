# Email Notification System - Future Improvements

## Current Limitations

### AWS SES Sandbox Mode
- **1 email/second** (will throttle if >1 subscriber)
- **200 emails/day** (will block after 200)
- Only verified email addresses

### Code Issues
1. **No rate limiting** - sends emails as fast as possible
2. **Synchronous loop** - can timeout with many subscribers
3. **No batching** - queries DB individually for each subscriber
4. **No retry logic** - if SES fails, email is lost

## Recommended Improvements

### 1. Request Production Access (Priority: HIGH)
Follow guide: `SES_PRODUCTION_ACCESS.md`

### 2. Add Rate Limiting (Priority: MEDIUM)
```typescript
// Add delay between emails to respect SES limits
const EMAILS_PER_SECOND = 14; // SES limit
const DELAY_MS = 1000 / EMAILS_PER_SECOND;

for (const subscription of subscribers) {
  await sendEmail(subscription);
  await new Promise(resolve => setTimeout(resolve, DELAY_MS));
}
```

### 3. Use SQS Queue (Priority: LOW - for scale)
For 100+ subscribers, move to async processing:
- API pushes notification job to SQS
- Lambda processes queue with rate limiting
- No timeout issues

### 4. Batch Database Queries (Priority: LOW)
```typescript
// Instead of N queries, do 1 query
const users = await db.execute(sql`
  SELECT u.id, u.email, p.email_notifications
  FROM auth.users u
  JOIN profiles p ON u.id = p.id
  WHERE u.id = ANY(${userIds})
`);
```

## Current Status: ✅ WORKS (1-10 subscribers)
## Breaking Point: ⚠️ 15+ subscribers (throttling), 200+ daily (limit)
