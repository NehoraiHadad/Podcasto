"""
Client modules for interacting with external services.

This package contains clients for AWS services and other external services:
- S3Client: For interacting with AWS S3
- SQSClient: For interacting with AWS SQS
- SupabaseClient: For interacting with Supabase database
"""
from src.clients.s3_client import S3Client
from src.clients.supabase_client import SupabaseClient
from src.clients.sqs_client import SQSClient 