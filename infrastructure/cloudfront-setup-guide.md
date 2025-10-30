# CloudFront CDN Setup Guide for Podcasto

## Overview

This guide walks through setting up AWS CloudFront as a Content Delivery Network (CDN) for Podcasto's audio delivery. CloudFront provides global edge caching, reducing latency by 50-70% and bandwidth costs by 60-80%.

## Architecture

```
┌─────────────┐
│   User      │
│  Browser    │
└──────┬──────┘
       │ HTTPS Request
       ▼
┌─────────────────────────────┐
│   CloudFront Edge Location  │  ◄── Cached Response (Cache Hit)
│  (400+ locations globally)  │
└──────────┬──────────────────┘
           │ Cache Miss
           ▼
┌─────────────────────────────┐
│    S3 Origin (us-east-1)    │
│  podcasto-podcasts bucket   │
└─────────────────────────────┘
```

**Request Flow**:
1. User requests audio file from CloudFront domain
2. CloudFront checks edge location cache (TTL: 1 day)
3. **Cache Hit**: Return cached file (fast, no S3 charge)
4. **Cache Miss**: Fetch from S3, cache at edge, return to user

## Prerequisites

- AWS Account with appropriate permissions
- AWS CLI configured (optional)
- S3 bucket: `podcasto-podcasts` in `us-east-1`
- Existing audio files in S3

## Setup Steps

### Step 1: Create CloudFront Distribution

#### Option A: AWS Console (Recommended for First Time)

1. **Navigate to CloudFront Console**
   - Go to: https://console.aws.amazon.com/cloudfront/v4/home
   - Click "Create Distribution"

2. **Configure Origin Settings**
   ```
   Origin Domain: podcasto-podcasts.s3.us-east-1.amazonaws.com
   Origin Path: (leave empty)
   Name: S3-podcasto-podcasts
   ```

3. **Origin Access**
   - **Select**: Origin Access Control (OAC)
   - **Click**: "Create control setting"
   - **Settings**:
     - Name: `podcasto-oac`
     - Description: "OAC for Podcasto audio files"
     - Signing behavior: "Sign requests (recommended)"
   - **Click**: "Create"

4. **Default Cache Behavior**
   ```
   Path Pattern: Default (*)
   Compress Objects: Yes
   Viewer Protocol Policy: Redirect HTTP to HTTPS
   Allowed HTTP Methods: GET, HEAD, OPTIONS
   Restrict Viewer Access: No
   ```

5. **Cache Policy**
   - **Select**: "CachingOptimized" (Managed Policy)
   - **TTL Settings**:
     - Minimum TTL: 1 second
     - Maximum TTL: 31,536,000 seconds (1 year)
     - Default TTL: 86,400 seconds (1 day)

6. **Origin Request Policy**
   - **Select**: "CORS-S3Origin" (Managed Policy)

7. **Distribution Settings**
   ```
   Price Class: Use all edge locations (or choose based on budget)
   Alternate Domain Names (CNAMEs): (leave empty unless custom domain)
   SSL Certificate: Default CloudFront certificate (*.cloudfront.net)
   Default Root Object: (leave empty)
   Logging: Off (or configure if needed)
   ```

8. **Create Distribution**
   - Click "Create Distribution"
   - **Wait**: Distribution deployment takes 10-20 minutes
   - **Status**: Wait until status shows "Enabled"

9. **Note Distribution Details**
   - Copy **Distribution Domain Name**: `d1234abcd.cloudfront.net`
   - Copy **Distribution ID**: `E1234ABCD5678`
   - Copy **Distribution ARN**: `arn:aws:cloudfront::123456789012:distribution/E1234ABCD5678`

#### Option B: AWS CLI (For Automation)

See `cloudfront-cli-setup.sh` script in this directory.

### Step 2: Update S3 Bucket Policy

CloudFront needs permission to access S3 objects via Origin Access Control.

1. **Navigate to S3 Console**
   - Go to: https://s3.console.aws.amazon.com/s3/buckets/podcasto-podcasts
   - Click "Permissions" tab
   - Scroll to "Bucket policy"

2. **Update Bucket Policy**

   Replace `YOUR_AWS_ACCOUNT_ID` and `YOUR_DISTRIBUTION_ID` with actual values:

   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Sid": "AllowCloudFrontServicePrincipalReadOnly",
         "Effect": "Allow",
         "Principal": {
           "Service": "cloudfront.amazonaws.com"
         },
         "Action": "s3:GetObject",
         "Resource": "arn:aws:s3:::podcasto-podcasts/*",
         "Condition": {
           "StringEquals": {
             "AWS:SourceArn": "arn:aws:cloudfront::YOUR_AWS_ACCOUNT_ID:distribution/YOUR_DISTRIBUTION_ID"
           }
         }
       }
     ]
   }
   ```

3. **Save Changes**
   - Click "Save changes"
   - Verify policy is applied successfully

**Important**: This policy restricts direct S3 access, allowing only CloudFront to fetch objects.

### Step 3: Test CloudFront Distribution

1. **Get Test Audio File**
   - Find an existing audio file in S3
   - Example: `podcasts/123/456/audio/podcast.wav`

2. **Build CloudFront URL**
   ```
   https://YOUR_CLOUDFRONT_DOMAIN/podcasts/123/456/audio/podcast.wav
   ```

3. **Test in Browser**
   - Open CloudFront URL in browser
   - Audio file should download/play
   - **First request**: Cache miss (slower)
   - **Second request**: Cache hit (faster)

4. **Verify Cache Headers**
   ```bash
   curl -I https://YOUR_CLOUDFRONT_DOMAIN/podcasts/123/456/audio/podcast.wav
   ```

   **Expected Headers**:
   ```
   HTTP/2 200
   x-cache: Hit from cloudfront            # Cache hit (subsequent requests)
   # OR
   x-cache: Miss from cloudfront           # Cache miss (first request)
   x-amz-cf-pop: SFO5-P1                  # Edge location served from
   age: 3600                               # Seconds cached (if cache hit)
   cache-control: max-age=86400           # 1 day TTL
   ```

### Step 4: Configure Application

1. **Development Environment** (`.env.local`)
   ```bash
   # Add to podcasto/.env.local
   CLOUDFRONT_DOMAIN=d1234abcd.cloudfront.net
   ```

2. **Production Environment** (Vercel)
   - Go to Vercel Project Settings → Environment Variables
   - Add variable:
     - **Key**: `CLOUDFRONT_DOMAIN`
     - **Value**: `d1234abcd.cloudfront.net`
     - **Environments**: Production, Preview (optional), Development (optional)
   - Save and redeploy

3. **Verify Configuration**
   ```bash
   cd podcasto
   npm run dev
   ```

   - Open browser console
   - Play an episode
   - Check Network tab → Audio request
   - URL should use CloudFront domain

### Step 5: Monitor Performance

1. **CloudFront Metrics** (AWS Console)
   - Navigate to CloudFront → Your Distribution → Monitoring
   - Key Metrics:
     - **Requests**: Total requests to distribution
     - **BytesDownloaded**: Data transferred from CloudFront
     - **ErrorRate**: 4xx/5xx error percentage
     - **CacheHitRate**: Percentage of cached responses

2. **S3 Metrics** (AWS Console)
   - Navigate to S3 → podcasto-podcasts → Metrics
   - Key Metrics:
     - **GetRequests**: Should drop 80-95% (edge caching)
     - **BytesDownloaded**: Should drop 60-80% (edge caching)

3. **Cost Monitoring**
   - **AWS Cost Explorer**:
     - Filter by service: CloudFront vs S3
     - Compare before/after CloudFront deployment
     - Expected: 60-80% reduction in total bandwidth costs

## Rollout Strategy

### Phase 1: Canary Deployment (10% Traffic)

1. **Deploy Code** with CloudFront support (disabled by default)
2. **Enable CloudFront** for 10% of users:
   - Set `CLOUDFRONT_DOMAIN` in Vercel (preview environment only)
   - Test with beta users
3. **Monitor** for 24-48 hours:
   - Check error rates
   - Measure latency improvements
   - Verify cost reduction

### Phase 2: Gradual Rollout (50% → 100%)

1. **50% Rollout**:
   - Enable CloudFront in production environment
   - Monitor for 48 hours
2. **100% Rollout**:
   - If no issues, leave enabled for all users
   - Update S3 bucket policy to restrict direct access

## Troubleshooting

### Issue: "Access Denied" Errors

**Symptoms**: CloudFront returns 403 Forbidden

**Solutions**:
1. Verify S3 bucket policy includes CloudFront OAC permissions
2. Check distribution ARN matches bucket policy
3. Ensure objects exist in S3 (check S3 console)
4. Verify CloudFront OAC is attached to distribution

### Issue: High Cache Miss Rate

**Symptoms**: Cache hit rate below 50%

**Solutions**:
1. Verify cache policy TTL is set (1 day default)
2. Check if query strings are being sent (strip them)
3. Review CloudFront access logs for cache behavior
4. Consider increasing TTL for static audio files

### Issue: Slow First Request

**Symptoms**: First audio load is slow, subsequent loads fast

**Explanation**: This is expected behavior (cache warming)

**Solutions**:
1. Pre-warm cache by requesting popular episodes after deployment
2. Use CloudFront cache invalidation for updated files
3. Accept tradeoff: First user slower, subsequent users faster

### Issue: CORS Errors

**Symptoms**: Browser blocks audio playback with CORS error

**Solutions**:
1. Add CORS headers to S3 bucket
2. Use "CORS-S3Origin" origin request policy in CloudFront
3. Verify `Access-Control-Allow-Origin: *` header in response

## Cost Estimation

Based on 100,000 audio requests/month with 50 MB average file size:

| Service | Before CloudFront | After CloudFront | Savings |
|---------|------------------|------------------|---------|
| **S3 Data Transfer** | $500/month | $100/month (20% cache misses) | -$400 |
| **S3 Requests** | $4/month | $0.80/month (20% cache misses) | -$3.20 |
| **CloudFront Data Transfer** | $0 | $85/month | +$85 |
| **CloudFront Requests** | $0 | $10/month | +$10 |
| **Total** | $504/month | $195.80/month | **-$308.20 (61% savings)** |

**Note**: Actual savings depend on cache hit rate, file sizes, and geographic distribution of users.

## Maintenance

### Invalidating Cache

When audio files are updated in S3, invalidate CloudFront cache:

```bash
aws cloudfront create-invalidation \
  --distribution-id YOUR_DISTRIBUTION_ID \
  --paths "/podcasts/123/456/audio/*"
```

**Note**: First 1,000 invalidations/month are free.

### Monitoring Alerts

Set up CloudWatch alarms:

1. **High Error Rate** (>5%)
   - Metric: `4xxErrorRate` or `5xxErrorRate`
   - Threshold: >5%
   - Action: SNS notification

2. **Low Cache Hit Rate** (<70%)
   - Metric: `CacheHitRate`
   - Threshold: <70%
   - Action: SNS notification

## Security Considerations

1. **S3 Bucket Policy**: Restrict access to CloudFront OAC only
2. **HTTPS Only**: Enforce HTTPS for all CloudFront requests
3. **Origin Access Control**: Use OAC instead of legacy OAI
4. **DDoS Protection**: AWS Shield Standard included by default
5. **Access Logs**: Enable CloudFront logging for audit trail

## References

- [CloudFront Documentation](https://docs.aws.amazon.com/cloudfront/)
- [Origin Access Control](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/private-content-restricting-access-to-s3.html)
- [CloudFront Pricing](https://aws.amazon.com/cloudfront/pricing/)
- [Cache Optimization Best Practices](https://aws.amazon.com/blogs/networking-and-content-delivery/amazon-cloudfront-announces-cache-and-origin-request-policies/)

## Next Steps

- [ ] Complete CloudFront distribution setup
- [ ] Update S3 bucket policy with OAC permissions
- [ ] Test CloudFront URL with audio playback
- [ ] Configure CLOUDFRONT_DOMAIN environment variable
- [ ] Deploy to production with monitoring
- [ ] Set up CloudWatch alarms for error rates
- [ ] Review cost savings after 1 week
