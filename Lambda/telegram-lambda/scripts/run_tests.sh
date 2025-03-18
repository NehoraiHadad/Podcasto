#!/bin/bash
# Script to run tests for the Telegram collector Lambda function

# Set environment variables for testing
export AWS_SAM_LOCAL=true
export TELEGRAM_API_ID=12345
export TELEGRAM_API_HASH=dummy_hash
export TELEGRAM_SESSION=dummy_session
export S3_BUCKET_NAME=telegram-data-collector-test

# Run unit tests
echo "Running unit tests..."
python -m pytest tests/unit -v

# Run integration tests
echo "Running integration tests..."
python -m pytest tests/integration -v

# Run a local test with a sample event
echo "Running local test with sample event..."
python -c "
import json
import sys
sys.path.append('.')
from src.lambda_handler import lambda_handler

with open('events/test_event.json', 'r') as f:
    event = json.load(f)

result = lambda_handler(event, None)
print(json.dumps(result, indent=2))
" 