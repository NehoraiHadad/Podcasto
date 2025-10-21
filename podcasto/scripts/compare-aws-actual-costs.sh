#!/bin/bash

# Script to compare tracked costs vs actual AWS costs
# Requires AWS CLI configured with credentials

echo "🔍 Comparing Tracked Costs vs Actual AWS Costs"
echo "=============================================="
echo ""

# Get date range - last 24 hours
START_DATE=$(date -u -d '24 hours ago' '+%Y-%m-%d')
END_DATE=$(date -u '+%Y-%m-%d')

echo "📅 Date Range: $START_DATE to $END_DATE"
echo ""

# Get actual AWS costs using Cost Explorer API
echo "💰 Fetching actual AWS costs from Cost Explorer..."
echo ""

# S3 costs
echo "📦 S3 Costs:"
aws ce get-cost-and-usage \
  --time-period Start=$START_DATE,End=$END_DATE \
  --granularity DAILY \
  --metrics UnblendedCost \
  --filter file:/dev/stdin <<EOF
{
  "Dimensions": {
    "Key": "SERVICE",
    "Values": ["Amazon Simple Storage Service"]
  }
}
EOF

echo ""

# Lambda costs
echo "⚡ Lambda Costs:"
aws ce get-cost-and-usage \
  --time-period Start=$START_DATE,End=$END_DATE \
  --granularity DAILY \
  --metrics UnblendedCost \
  --filter file:/dev/stdin <<EOF
{
  "Dimensions": {
    "Key": "SERVICE",
    "Values": ["AWS Lambda"]
  }
}
EOF

echo ""

# SES costs
echo "📧 SES Costs:"
aws ce get-cost-and-usage \
  --time-period Start=$START_DATE,End=$END_DATE \
  --granularity DAILY \
  --metrics UnblendedCost \
  --filter file:/dev/stdin <<EOF
{
  "Dimensions": {
    "Key": "SERVICE",
    "Values": ["Amazon Simple Email Service"]
  }
}
EOF

echo ""

# SQS costs
echo "📨 SQS Costs:"
aws ce get-cost-and-usage \
  --time-period Start=$START_DATE,End=$END_DATE \
  --granularity DAILY \
  --metrics UnblendedCost \
  --filter file:/dev/stdin <<EOF
{
  "Dimensions": {
    "Key": "SERVICE",
    "Values": ["Amazon Simple Queue Service"]
  }
}
EOF

echo ""
echo "✅ Actual AWS costs retrieved"
echo ""
echo "💡 TIP: Compare these with the costs shown in /admin/costs dashboard"
echo "      The dashboard should match (or be slightly lower due to delays)"
