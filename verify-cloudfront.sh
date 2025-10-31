#!/bin/bash

echo "🔍 CloudFront Verification Script"
echo "=================================="
echo ""

# Test 1: Check CloudFront Distribution Status
echo "📊 Test 1: Checking CloudFront Distribution Status"
DIST_STATUS=$(aws cloudfront get-distribution --id ENI2WO6H50E44 --query 'Distribution.Status' --output text 2>/dev/null)
if [ "$DIST_STATUS" = "Deployed" ]; then
    echo "✅ CloudFront Distribution: Deployed"
else
    echo "❌ CloudFront Distribution: $DIST_STATUS"
fi
echo ""

# Test 2: Check S3 Bucket Policy (should be CloudFront-only)
echo "📊 Test 2: Checking S3 Bucket Policy Security"
POLICY=$(aws s3api get-bucket-policy --bucket podcasto-podcasts --query 'Policy' --output text 2>/dev/null)
if echo "$POLICY" | grep -q "cloudfront.amazonaws.com"; then
    echo "✅ S3 Bucket Policy: Secured (CloudFront-only access)"
else
    echo "⚠️  S3 Bucket Policy: May not be properly secured"
fi
echo ""

# Test 3: Test CloudFront URL (need a sample file)
echo "📊 Test 3: Testing CloudFront URL"
echo "Looking for a sample audio file..."

# Find a sample audio file from S3
SAMPLE_FILE=$(aws s3 ls s3://podcasto-podcasts/podcasts/ --recursive | grep "audio/podcast.wav" | head -1 | awk '{print $4}')

if [ -n "$SAMPLE_FILE" ]; then
    echo "Found sample file: $SAMPLE_FILE"
    echo ""
    echo "Testing CloudFront URL:"
    CLOUDFRONT_URL="https://d1rfoqxjgv1gpt.cloudfront.net/$SAMPLE_FILE"
    echo "$CLOUDFRONT_URL"

    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$CLOUDFRONT_URL")

    if [ "$HTTP_CODE" = "200" ]; then
        echo "✅ CloudFront URL: Accessible (HTTP $HTTP_CODE)"

        # Check for cache header
        CACHE_HEADER=$(curl -s -I "$CLOUDFRONT_URL" | grep -i "x-cache" | head -1)
        if [ -n "$CACHE_HEADER" ]; then
            echo "✅ Cache Header: $CACHE_HEADER"
        fi
    else
        echo "❌ CloudFront URL: Not accessible (HTTP $HTTP_CODE)"
    fi

    echo ""
    echo "Testing S3 Direct URL (should be blocked):"
    S3_URL="https://podcasto-podcasts.s3.amazonaws.com/$SAMPLE_FILE"
    HTTP_CODE_S3=$(curl -s -o /dev/null -w "%{http_code}" "$S3_URL")

    if [ "$HTTP_CODE_S3" = "403" ]; then
        echo "✅ S3 Direct Access: Blocked (HTTP $HTTP_CODE_S3) - Security working!"
    else
        echo "⚠️  S3 Direct Access: HTTP $HTTP_CODE_S3 - Expected 403"
    fi
else
    echo "⚠️  No sample audio files found in S3"
fi

echo ""
echo "=================================="
echo "🎯 Summary:"
echo "1. After adding CLOUDFRONT_DOMAIN to Vercel"
echo "2. After redeploying the app"
echo "3. Audio URLs should start with: https://d1rfoqxjgv1gpt.cloudfront.net/"
echo "4. Images should also load through CloudFront"
echo ""
