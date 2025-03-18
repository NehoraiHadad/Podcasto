#!/usr/bin/env python
"""
Script to test the Telegram collector Lambda function locally.
"""
import json
import sys
import os
from pathlib import Path
from dotenv import load_dotenv

# Add the project root to Python path
project_root = Path(__file__).parent.parent
sys.path.append(str(project_root))

# Load environment variables from .env file
env_path = project_root / ".env"
load_dotenv(env_path)

from src.lambda_handler import lambda_handler

def main():
    """Run the Lambda function with a test event."""
    # Load test event
    event_path = project_root / "events" / "test_event.json"
    with open(event_path, 'r') as f:
        event = json.load(f)
    
    # Run the Lambda function
    result = lambda_handler(event, None)
    
    # Print the result
    print(json.dumps(result, indent=2))

if __name__ == "__main__":
    main() 