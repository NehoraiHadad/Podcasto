#!/bin/bash

echo "🔍 Cost Tracking Accuracy Verification"
echo "======================================"
echo ""

# Get the latest episode ID from database
LATEST_EPISODE=$(psql "$DATABASE_URL" -t -c "SELECT id FROM episodes ORDER BY created_at DESC LIMIT 1" | tr -d ' ')

if [ -z "$LATEST_EPISODE" ]; then
    echo "❌ No episodes found in database"
    exit 1
fi

echo "📌 Latest Episode ID: $LATEST_EPISODE"
echo ""

# Get tracked costs from our system
echo "💾 OUR TRACKED COSTS:"
echo "===================="
psql "$DATABASE_URL" -c "
SELECT
    service,
    COUNT(*) as event_count,
    SUM(quantity::numeric) as total_quantity,
    unit,
    unit_cost_usd,
    SUM(total_cost_usd::numeric) as total_cost
FROM cost_tracking_events
WHERE episode_id = '$LATEST_EPISODE'
GROUP BY service, unit, unit_cost_usd
ORDER BY total_cost DESC;
"

echo ""
echo "💰 EPISODE COST SUMMARY:"
psql "$DATABASE_URL" -c "
SELECT
    total_cost_usd,
    ai_text_cost_usd,
    ai_image_cost_usd,
    total_tokens,
    total_s3_operations,
    total_emails_sent
FROM episode_costs
WHERE episode_id = '$LATEST_EPISODE';
"

echo ""
echo "🔎 AWS ACTUAL USAGE (Last 24h):"
echo "================================"

# Lambda invocations
echo "⚡ Lambda Invocations:"
aws logs filter-log-events \
    --log-group-name /aws/lambda/podcasto-audio-generation-dev \
    --start-time $(($(date +%s) - 86400))000 \
    --filter-pattern "START RequestId" \
    --query 'events[].message' \
    --output text | wc -l

echo ""
# S3 operations (approximate from recent uploads)
echo "📦 S3 Recent Files:"
aws s3api list-objects-v2 \
    --bucket podcasto-audio \
    --query "length(Contents[?LastModified>='$(date -u -d '24 hours ago' --iso-8601=seconds)'])" \
    --output text

echo ""
echo "📧 SES Emails Sent (from logs):"
aws logs filter-log-events \
    --log-group-name /aws/lambda/podcasto-audio-generation-dev \
    --start-time $(($(date +%s) - 86400))000 \
    --filter-pattern "Sent email" \
    --query 'length(events)' \
    --output text || echo "0"

echo ""
echo "💡 MANUAL CALCULATION:"
echo "====================="
echo "Based on pricing constants:"
echo "  - Gemini Text: \$0.00000075 per token"
echo "  - Gemini Image: \$0.01 per image"
echo "  - S3 PUT: \$0.000005 per request"
echo "  - Lambda: \$0.0000166667 per GB-second"
echo "  - SES: \$0.0001 per email"
echo ""
echo "If episode used:"
TOKENS=$(psql "$DATABASE_URL" -t -c "SELECT total_tokens FROM episode_costs WHERE episode_id = '$LATEST_EPISODE'" | tr -d ' ')
echo "  - $TOKENS tokens × \$0.00000075 = \$$(echo "scale=6; $TOKENS * 0.00000075" | bc)"
echo "  - 1 image × \$0.01 = \$0.01"
echo "  - 3 S3 PUTs × \$0.000005 = \$0.000015"
echo "  - 10 emails × \$0.0001 = \$0.001"
