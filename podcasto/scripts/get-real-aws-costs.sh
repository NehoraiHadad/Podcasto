#!/bin/bash
# Get actual AWS costs from Cost Explorer
# Requires ce:GetCostAndUsage permission

echo "🔍 AWS Cost Explorer - Actual Costs"
echo "===================================="
echo ""

# Last 7 days
START_DATE=$(date -u -d '7 days ago' '+%Y-%m-%d')
END_DATE=$(date -u '+%Y-%m-%d')

echo "📅 Period: $START_DATE to $END_DATE"
echo ""

# Get total costs
echo "💰 Total Daily Costs:"
aws ce get-cost-and-usage \
  --time-period Start=$START_DATE,End=$END_DATE \
  --granularity DAILY \
  --metrics UnblendedCost \
  --output table

echo ""
echo "📊 Costs by Service:"
aws ce get-cost-and-usage \
  --time-period Start=$START_DATE,End=$END_DATE \
  --granularity DAILY \
  --metrics UnblendedCost \
  --group-by Type=DIMENSION,Key=SERVICE \
  --output table

echo ""
echo "✅ Cost data retrieved from AWS Cost Explorer"
echo ""
echo "💡 Compare these actual costs with what's shown in /admin/costs"
