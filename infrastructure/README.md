# Podcasto Infrastructure

This directory contains infrastructure-as-code templates and deployment scripts for Podcasto's AWS infrastructure.

## Contents

### CloudFront CDN

- **`cloudfront-setup-guide.md`**: Comprehensive manual setup guide for CloudFront distribution
- **`cloudfront-distribution.yml`**: CloudFormation template for automated CloudFront deployment
- **`deploy-cloudfront.sh`**: Bash script for one-command CloudFront deployment

## Quick Start

### Option 1: Automated Deployment (Recommended)

Deploy CloudFront distribution using CloudFormation:

```bash
cd infrastructure

# Deploy to production
./deploy-cloudfront.sh production

# Deploy to staging
./deploy-cloudfront.sh staging

# Deploy to development
./deploy-cloudfront.sh development
```

**Requirements**:
- AWS CLI installed and configured
- Appropriate AWS permissions (CloudFormation, CloudFront, S3)
- `jq` installed (for parsing JSON output)

**What it does**:
1. Validates CloudFormation template
2. Creates/updates CloudFront distribution
3. Configures Origin Access Control (OAC)
4. Updates S3 bucket policy
5. Outputs distribution details and next steps

### Option 2: Manual Setup

Follow the step-by-step guide in `cloudfront-setup-guide.md` for manual AWS Console setup.

## CloudFormation Template Parameters

The `cloudfront-distribution.yml` template accepts the following parameters:

| Parameter | Default | Description |
|-----------|---------|-------------|
| `S3BucketName` | `podcasto-podcasts` | Name of S3 bucket containing audio files |
| `S3BucketRegion` | `us-east-1` | AWS region where S3 bucket is located |
| `PriceClass` | `PriceClass_All` | CloudFront price class (All/200/100 edge locations) |
| `CacheTTL` | `86400` | Default cache TTL in seconds (1 day) |
| `Environment` | `production` | Environment name for tagging |

## Stack Outputs

After deployment, the CloudFormation stack provides these outputs:

- **DistributionId**: CloudFront distribution ID (for AWS CLI commands)
- **DistributionDomainName**: CloudFront domain name (for `CLOUDFRONT_DOMAIN` env var)
- **DistributionARN**: Full ARN of the distribution
- **OriginAccessControlId**: OAC ID for reference

## Post-Deployment Steps

1. **Wait for deployment** (10-20 minutes)
   ```bash
   aws cloudfront get-distribution \
     --id YOUR_DISTRIBUTION_ID \
     --query 'Distribution.Status'
   ```

2. **Add environment variable** to Next.js application:
   ```bash
   # .env.local (development)
   CLOUDFRONT_DOMAIN=d1234abcd.cloudfront.net

   # Vercel (production)
   # Add via Vercel dashboard → Settings → Environment Variables
   ```

3. **Test CloudFront URL**:
   ```bash
   curl -I https://YOUR_CLOUDFRONT_DOMAIN/podcasts/123/456/audio/file.wav
   ```

4. **Monitor performance**:
   - CloudFront Console → Monitoring tab
   - Check cache hit rate (should be 80-95%)
   - Review cost savings in AWS Cost Explorer

## Monitoring

### CloudWatch Metrics

Key metrics to monitor:

- **Requests**: Total requests to distribution
- **BytesDownloaded**: Data transferred from CloudFront
- **CacheHitRate**: Percentage of cached responses (target: 80-95%)
- **ErrorRate**: 4xx/5xx error percentage (target: <5%)

### Cost Optimization

Expected cost reduction with CloudFront:

- **S3 Data Transfer**: 80% reduction (edge caching)
- **S3 Requests**: 90% reduction (edge caching)
- **Total Bandwidth Costs**: 60-80% reduction
- **CloudFront Costs**: New cost, but lower than S3 savings

## Troubleshooting

### Stack Creation Fails

**Check CloudFormation events**:
```bash
aws cloudformation describe-stack-events \
  --stack-name podcasto-cloudfront \
  --max-items 20 \
  --query 'StackEvents[*].[Timestamp,ResourceStatus,ResourceType,ResourceStatusReason]' \
  --output table
```

### Distribution Deployment Takes Long

CloudFront distributions typically take 10-20 minutes to deploy. This is normal.

### S3 Access Denied Errors

Verify S3 bucket policy was updated correctly:
```bash
aws s3api get-bucket-policy --bucket podcasto-podcasts
```

## Updating the Stack

To update an existing CloudFront distribution:

```bash
# Make changes to cloudfront-distribution.yml
./deploy-cloudfront.sh production
```

The script automatically detects if the stack exists and performs an update.

## Deleting the Stack

To remove CloudFront distribution:

```bash
aws cloudformation delete-stack \
  --stack-name podcasto-cloudfront \
  --region us-east-1

# Wait for deletion to complete
aws cloudformation wait stack-delete-complete \
  --stack-name podcasto-cloudfront \
  --region us-east-1
```

**Warning**: This will remove the CloudFront distribution and revert S3 bucket policy. Audio files will revert to direct S3 access.

## Security Considerations

1. **Origin Access Control (OAC)**: Replaces legacy Origin Access Identity (OAI) for better security
2. **S3 Bucket Policy**: Restricts access to CloudFront only (no direct S3 access)
3. **HTTPS Enforced**: All CloudFront requests redirected to HTTPS
4. **DDoS Protection**: AWS Shield Standard included by default
5. **Access Logs**: CloudFront logs stored in S3 for audit trail

## Resources

- [AWS CloudFront Documentation](https://docs.aws.amazon.com/cloudfront/)
- [CloudFormation CloudFront Reference](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-cloudfront-distribution.html)
- [Origin Access Control Guide](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/private-content-restricting-access-to-s3.html)
- [CloudFront Pricing](https://aws.amazon.com/cloudfront/pricing/)

## Support

For issues or questions:

1. Check `cloudfront-setup-guide.md` for detailed troubleshooting
2. Review CloudFormation stack events for error details
3. Check CloudFront distribution logs in S3
4. Verify S3 bucket policy and OAC configuration
