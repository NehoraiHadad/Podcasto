#!/bin/bash

# SES Notification Handler Lambda Deployment Script
# Usage: ./deploy.sh [dev|prod]

set -e

# Default to prod if no argument provided
ENV=${1:-prod}

# Validate environment
if [[ ! "$ENV" =~ ^(dev|prod)$ ]]; then
    echo "Error: Invalid environment. Use 'dev' or 'prod'"
    exit 1
fi

echo "🚀 Deploying SES Notification Handler Lambda to $ENV environment..."

# Determine secrets manager name
if [ "$ENV" = "prod" ]; then
    SECRETS_NAME="podcasto-secrets"
else
    SECRETS_NAME="podcasto-secrets-dev"
fi

echo "📋 Using AWS Secrets Manager: $SECRETS_NAME"
echo "⚠️  Make sure $SECRETS_NAME contains DATABASE_URL key!"

# Build and deploy
echo "📦 Building Lambda function..."
sam build

echo "🚢 Deploying to AWS..."
sam deploy \
    --stack-name "ses-notification-handler-${ENV}" \
    --s3-bucket aws-sam-cli-managed-default-samclisourcebucket-q6b1kuplf6yj \
    --parameter-overrides \
        Environment=$ENV \
        SecretsManagerName=$SECRETS_NAME \
    --capabilities CAPABILITY_IAM \
    --region us-east-1 \
    --no-confirm-changeset \
    --no-fail-on-empty-changeset

echo "✅ Deployment complete!"
echo "📊 Check CloudWatch Logs: /aws/lambda/ses-notification-handler-${ENV}"
echo ""
echo "🔍 Verify SNS subscriptions:"
echo "   aws sns list-subscriptions-by-topic --topic-arn arn:aws:sns:us-east-1:638520701769:podcasto-ses-bounces"
echo "   aws sns list-subscriptions-by-topic --topic-arn arn:aws:sns:us-east-1:638520701769:podcasto-ses-complaints"
