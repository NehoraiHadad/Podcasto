#!/usr/bin/env python
"""
Script to deploy the Telegram collector Lambda function.
"""
import os
import sys
import shutil
import subprocess
import tempfile
from pathlib import Path

def deploy():
    """Deploy the Lambda function to AWS."""
    # Get the root directory of the project
    root_dir = Path(__file__).parent.parent.absolute()
    
    # Create a temporary directory for the deployment package
    with tempfile.TemporaryDirectory() as temp_dir:
        temp_path = Path(temp_dir)
        
        print(f"Creating deployment package in {temp_dir}")
        
        # Copy the source code to the temporary directory
        shutil.copytree(root_dir / "src", temp_path / "src")
        
        # Copy the requirements.txt file
        shutil.copy(root_dir / "requirements.txt", temp_path / "requirements.txt")
        
        # Install dependencies
        print("Installing dependencies...")
        subprocess.run(
            [sys.executable, "-m", "pip", "install", "-r", "requirements.txt", "-t", "."],
            cwd=temp_path,
            check=True
        )
        
        # Create a zip file
        print("Creating zip file...")
        zip_path = root_dir / "function.zip"
        if zip_path.exists():
            zip_path.unlink()
        
        subprocess.run(
            ["zip", "-r", str(zip_path), "."],
            cwd=temp_path,
            check=True
        )
        
        # Deploy to AWS Lambda
        print("Deploying to AWS Lambda...")
        function_name = os.getenv("AWS_LAMBDA_FUNCTION_NAME", "telegram-collector")
        
        subprocess.run(
            [
                "aws", "lambda", "update-function-code",
                "--function-name", function_name,
                "--zip-file", f"fileb://{zip_path}"
            ],
            check=True
        )
        
        print(f"Successfully deployed to AWS Lambda function: {function_name}")

if __name__ == "__main__":
    deploy() 