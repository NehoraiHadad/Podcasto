#!/bin/bash
#
# CloudFront Distribution Deployment Script for Podcasto
#
# This script deploys a CloudFront distribution using AWS CloudFormation
#
# Usage:
#   ./deploy-cloudfront.sh [environment]
#
# Environments:
#   - development
#   - staging
#   - production (default)
#

set -e  # Exit on error

# Configuration
STACK_NAME="podcasto-cloudfront"
TEMPLATE_FILE="cloudfront-distribution.yml"
REGION="${AWS_REGION:-us-east-1}"

# Parse arguments
ENVIRONMENT="${1:-production}"

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(development|staging|production)$ ]]; then
  echo "Error: Invalid environment '$ENVIRONMENT'"
  echo "Valid environments: development, staging, production"
  exit 1
fi

# Update stack name with environment
if [ "$ENVIRONMENT" != "production" ]; then
  STACK_NAME="podcasto-cloudfront-$ENVIRONMENT"
fi

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
log_info() {
  echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
  echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

# Validate AWS CLI is installed
if ! command -v aws &> /dev/null; then
  log_error "AWS CLI is not installed. Please install it first:"
  echo "  https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html"
  exit 1
fi

# Validate AWS credentials
if ! aws sts get-caller-identity &> /dev/null; then
  log_error "AWS credentials not configured. Run 'aws configure' first."
  exit 1
fi

# Get AWS Account ID
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
log_info "AWS Account ID: $AWS_ACCOUNT_ID"
log_info "Region: $REGION"
log_info "Environment: $ENVIRONMENT"
log_info "Stack Name: $STACK_NAME"

# Check if template exists
if [ ! -f "$TEMPLATE_FILE" ]; then
  log_error "Template file not found: $TEMPLATE_FILE"
  exit 1
fi

# Validate CloudFormation template
log_info "Validating CloudFormation template..."
if ! aws cloudformation validate-template \
  --template-body "file://$TEMPLATE_FILE" \
  --region "$REGION" > /dev/null; then
  log_error "Template validation failed"
  exit 1
fi
log_info "Template validation successful"

# Check if stack exists
STACK_EXISTS=$(aws cloudformation describe-stacks \
  --stack-name "$STACK_NAME" \
  --region "$REGION" \
  --query 'Stacks[0].StackStatus' \
  --output text 2>/dev/null || echo "DOES_NOT_EXIST")

# Determine action (create or update)
if [ "$STACK_EXISTS" == "DOES_NOT_EXIST" ]; then
  ACTION="create"
  COMMAND="create-stack"
  log_info "Stack does not exist. Creating new stack..."
else
  ACTION="update"
  COMMAND="update-stack"
  log_info "Stack exists with status: $STACK_EXISTS"
  log_info "Updating existing stack..."
fi

# Deploy stack
log_info "Deploying CloudFront distribution..."

DEPLOY_OUTPUT=$(aws cloudformation "$COMMAND" \
  --stack-name "$STACK_NAME" \
  --template-body "file://$TEMPLATE_FILE" \
  --parameters \
    ParameterKey=Environment,ParameterValue="$ENVIRONMENT" \
  --capabilities CAPABILITY_IAM \
  --region "$REGION" \
  --tags \
    Key=Project,Value=Podcasto \
    Key=Environment,Value="$ENVIRONMENT" \
    Key=ManagedBy,Value=CloudFormation \
  2>&1) || {
  if [[ "$DEPLOY_OUTPUT" == *"No updates are to be performed"* ]]; then
    log_warn "No changes detected. Stack is already up-to-date."
    exit 0
  else
    log_error "Deployment failed:"
    echo "$DEPLOY_OUTPUT"
    exit 1
  fi
}

# Wait for stack operation to complete
log_info "Waiting for stack operation to complete..."
log_warn "This may take 10-20 minutes for CloudFront distribution deployment"

aws cloudformation wait "stack-${ACTION}-complete" \
  --stack-name "$STACK_NAME" \
  --region "$REGION" || {
  log_error "Stack operation failed or timed out"

  # Show stack events
  log_info "Recent stack events:"
  aws cloudformation describe-stack-events \
    --stack-name "$STACK_NAME" \
    --region "$REGION" \
    --max-items 10 \
    --query 'StackEvents[*].[Timestamp,ResourceStatus,ResourceType,ResourceStatusReason]' \
    --output table

  exit 1
}

log_info "Stack operation completed successfully!"

# Get stack outputs
log_info "Retrieving stack outputs..."

OUTPUTS=$(aws cloudformation describe-stacks \
  --stack-name "$STACK_NAME" \
  --region "$REGION" \
  --query 'Stacks[0].Outputs' \
  --output json)

DISTRIBUTION_ID=$(echo "$OUTPUTS" | jq -r '.[] | select(.OutputKey=="DistributionId") | .OutputValue')
DISTRIBUTION_DOMAIN=$(echo "$OUTPUTS" | jq -r '.[] | select(.OutputKey=="DistributionDomainName") | .OutputValue')
DISTRIBUTION_ARN=$(echo "$OUTPUTS" | jq -r '.[] | select(.OutputKey=="DistributionARN") | .OutputValue')

# Display results
echo ""
echo "=========================================="
echo "   CloudFront Distribution Deployed!"
echo "=========================================="
echo ""
echo "Distribution ID:     $DISTRIBUTION_ID"
echo "Distribution Domain: $DISTRIBUTION_DOMAIN"
echo "Distribution ARN:    $DISTRIBUTION_ARN"
echo ""
echo "=========================================="
echo "   Next Steps"
echo "=========================================="
echo ""
echo "1. Wait for CloudFront distribution to deploy (10-20 minutes)"
echo "   Check status: aws cloudfront get-distribution --id $DISTRIBUTION_ID --region $REGION --query 'Distribution.Status'"
echo ""
echo "2. Add environment variable to Next.js application:"
echo "   CLOUDFRONT_DOMAIN=$DISTRIBUTION_DOMAIN"
echo ""
echo "3. Test CloudFront URL:"
echo "   https://$DISTRIBUTION_DOMAIN/podcasts/YOUR_PODCAST/YOUR_EPISODE/audio/file.wav"
echo ""
echo "4. Monitor performance in CloudFront console:"
echo "   https://console.aws.amazon.com/cloudfront/v4/home#/distributions/$DISTRIBUTION_ID"
echo ""
echo "5. Review cost savings after 1 week in AWS Cost Explorer"
echo ""
echo "=========================================="
