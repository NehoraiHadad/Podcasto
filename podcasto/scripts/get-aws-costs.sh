#!/bin/bash

# Get actual AWS costs for the last 24 hours

START_DATE=$(date -u -d '24 hours ago' '+%Y-%m-%d')
END_DATE=$(date -u '+%Y-%m-%d')

echo "🔍 AWS Actual Costs Report"
echo "=========================="
echo "Date Range: $START_DATE to $END_DATE"
echo ""

echo "📦 S3 Costs:"
aws ce get-cost-and-usage \
  --time-period Start=$START_DATE,End=$END_DATE \
  --granularity DAILY \
  --metrics UnblendedCost \
  --group-by Type=DIMENSION,Key=SERVICE \
  --filter '{"Dimensions":{"Key":"SERVICE","Values":["Amazon Simple Storage Service"]}}' \
  --output json | jq -r '.ResultsByTime[].Groups[] | "\(.Keys[0]): $\(.Metrics.UnblendedCost.Amount)"'

echo ""
echo "⚡ Lambda Costs:"
aws ce get-cost-and-usage \
  --time-period Start=$START_DATE,End=$END_DATE \
  --granularity DAILY \
  --metrics UnblendedCost \
  --group-by Type=DIMENSION,Key=SERVICE \
  --filter '{"Dimensions":{"Key":"SERVICE","Values":["AWS Lambda"]}}' \
  --output json | jq -r '.ResultsByTime[].Groups[] | "\(.Keys[0]): $\(.Metrics.UnblendedCost.Amount)"'

echo ""
echo "📧 SES Costs:"
aws ce get-cost-and-usage \
  --time-period Start=$START_DATE,End=$END_DATE \
  --granularity DAILY \
  --metrics UnblendedCost \
  --group-by Type=DIMENSION,Key=SERVICE \
  --filter '{"Dimensions":{"Key":"SERVICE","Values":["Amazon Simple Email Service"]}}' \
  --output json | jq -r '.ResultsByTime[].Groups[] | "\(.Keys[0]): $\(.Metrics.UnblendedCost.Amount)"'

echo ""
echo "📨 SQS Costs:"
aws ce get-cost-and-usage \
  --time-period Start=$START_DATE,End=$END_DATE \
  --granularity DAILY \
  --metrics UnblendedCost \
  --group-by Type=DIMENSION,Key=SERVICE \
  --filter '{"Dimensions":{"Key":"SERVICE","Values":["Amazon Simple Queue Service"]}}' \
  --output json | jq -r '.ResultsByTime[].Groups[] | "\(.Keys[0]): $\(.Metrics.UnblendedCost.Amount)"'

echo ""
echo "💰 Total AWS Cost (All Services):"
aws ce get-cost-and-usage \
  --time-period Start=$START_DATE,End=$END_DATE \
  --granularity DAILY \
  --metrics UnblendedCost \
  --output json | jq -r '.ResultsByTime[] | "Total: $\(.Total.UnblendedCost.Amount) USD"'
