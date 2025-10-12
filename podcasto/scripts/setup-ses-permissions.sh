#!/bin/bash

# Script to set up IAM permissions for AWS SES email sending
# This creates or updates the IAM policy with necessary permissions

set -e  # Exit on error

POLICY_NAME="PodcastoSESSendOnly"
IAM_USER="podcasto-s3-access"
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

echo "Setting up SES permissions for IAM user: $IAM_USER"
echo "Account ID: $ACCOUNT_ID"

# Create policy document
cat > /tmp/ses-policy.json <<'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "SendEmailOnly",
      "Effect": "Allow",
      "Action": [
        "ses:SendEmail",
        "ses:SendRawEmail",
        "ses:SendTemplatedEmail",
        "ses:SendBulkTemplatedEmail"
      ],
      "Resource": "*",
      "Condition": {
        "StringEquals": {
          "ses:FromAddress": "notifications@podcasto.org"
        }
      }
    }
  ]
}
EOF

POLICY_ARN="arn:aws:iam::${ACCOUNT_ID}:policy/${POLICY_NAME}"

# Check if policy exists
if aws iam get-policy --policy-arn "$POLICY_ARN" 2>/dev/null; then
  echo "Policy exists. Creating new version..."

  # Delete oldest non-default versions if we have 5 (AWS limit)
  VERSIONS=$(aws iam list-policy-versions --policy-arn "$POLICY_ARN" --query 'Versions[?IsDefaultVersion==`false`].VersionId' --output text)
  VERSION_COUNT=$(echo "$VERSIONS" | wc -w)

  if [ "$VERSION_COUNT" -ge 4 ]; then
    echo "Deleting oldest policy version to stay within AWS limits..."
    OLDEST=$(aws iam list-policy-versions --policy-arn "$POLICY_ARN" --query 'Versions[?IsDefaultVersion==`false`] | sort_by(@, &CreateDate) | [0].VersionId' --output text)
    aws iam delete-policy-version --policy-arn "$POLICY_ARN" --version-id "$OLDEST"
  fi

  aws iam create-policy-version --policy-arn "$POLICY_ARN" --policy-document file:///tmp/ses-policy.json --set-as-default
  echo "✅ Policy updated successfully!"
else
  echo "Policy doesn't exist. Creating..."
  aws iam create-policy \
    --policy-name "$POLICY_NAME" \
    --policy-document file:///tmp/ses-policy.json \
    --description "Minimal SES permissions for Podcasto - send emails only from notifications@podcasto.org"

  echo "Attaching policy to user $IAM_USER..."
  aws iam attach-user-policy --user-name "$IAM_USER" --policy-arn "$POLICY_ARN"

  echo "✅ Policy created and attached successfully!"
fi

# Cleanup
rm /tmp/ses-policy.json

echo ""
echo "SES Permissions configured:"
echo "  - ses:SendEmail"
echo "  - ses:SendRawEmail"
echo "  - ses:SendTemplatedEmail"
echo "  - ses:SendBulkTemplatedEmail"
echo ""
echo "Restricted to sending from: notifications@podcasto.org"
