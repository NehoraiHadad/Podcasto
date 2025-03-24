"""
Podcast Scheduler Lambda Function

This Lambda function checks which podcasts need new episodes based on their frequency
and triggers generation Lambda functions.
"""
import json
import os
import boto3
import requests
from datetime import datetime
from typing import List, Dict, Any, Optional

# Initialize AWS clients
lambda_client = boto3.client('lambda')

class SupabaseClient:
    """Simple client for interacting with Supabase"""
    
    def __init__(self):
        """Initialize the Supabase client"""
        self.supabase_url = os.environ.get('SUPABASE_URL', '').rstrip('/')
        self.supabase_key = os.environ.get('SUPABASE_KEY', '')
        
        if not self.supabase_url or not self.supabase_key:
            raise ValueError("SUPABASE_URL and SUPABASE_KEY environment variables must be set")
        
        self.headers = {
            'apikey': self.supabase_key,
            'Authorization': f'Bearer {self.supabase_key}',
            'Content-Type': 'application/json'
        }
        
        # Set up session for connection pooling
        self.session = requests.Session()
        self.timeout = 30
    
    def check_podcasts_for_new_episodes(self) -> List[Dict[str, Any]]:
        """Call the database function to check which podcasts need new episodes"""
        try:
            response = self.session.post(
                f"{self.supabase_url}/rest/v1/rpc/check_podcasts_for_new_episodes",
                headers=self.headers,
                timeout=self.timeout
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                print(f"Error checking podcasts: {response.status_code} - {response.text}")
                return []
        except Exception as e:
            print(f"Exception in check_podcasts_for_new_episodes: {str(e)}")
            return []
    
    def fetch_podcast_config(self, podcast_config_id: str) -> Optional[Dict[str, Any]]:
        """Fetch the configuration for a podcast from the podcast_configs table"""
        if not podcast_config_id or podcast_config_id == "None":
            return None
            
        try:
            # First try: search by id (primary key)
            response = self.session.get(
                f"{self.supabase_url}/rest/v1/podcast_configs",
                headers=self.headers,
                params={"select": "*", "id": f"eq.{podcast_config_id}"},
                timeout=self.timeout
            )
            
            if response.status_code == 200:
                results = response.json()
                if results:
                    return results[0]
                    
            # Second try: if not found by id, try by podcast_id 
            response = self.session.get(
                f"{self.supabase_url}/rest/v1/podcast_configs",
                headers=self.headers,
                params={"select": "*", "podcast_id": f"eq.{podcast_config_id}"},
                timeout=self.timeout
            )
            
            if response.status_code == 200:
                results = response.json()
                if results:
                    return results[0]
                    
            print(f"No podcast config found for ID: {podcast_config_id}")
            return None
            
        except Exception as e:
            print(f"Error fetching podcast config: {str(e)}")
            return None
    
    def close_session(self):
        """Close the requests session"""
        try:
            self.session.close()
        except Exception as e:
            print(f"Error closing session: {str(e)}")

def lambda_handler(event, context):
    """Lambda handler for the Podcast Scheduler"""
    print("Starting Podcast Scheduler Lambda...")
    
    # Initialize Supabase client
    supabase_client = SupabaseClient()
    
    try:
        # Check which podcasts need new episodes
        podcasts_needing_episodes = supabase_client.check_podcasts_for_new_episodes()
        
        if not podcasts_needing_episodes:
            print("No podcasts need new episodes")
            return {
                'statusCode': 200,
                'body': json.dumps({
                    'message': 'No podcasts need new episodes',
                    'timestamp': datetime.now().isoformat()
                })
            }
        
        print(f"Found {len(podcasts_needing_episodes)} podcasts needing episodes")
        
        # Get environment variables
        sqs_queue_url = os.environ.get('SQS_QUEUE_URL')
        telegram_lambda_name = os.environ.get('TELEGRAM_LAMBDA_NAME')
        
        if not sqs_queue_url or not telegram_lambda_name:
            return {
                'statusCode': 500,
                'body': json.dumps({
                    'error': 'Required environment variables not set'
                })
            }
        
        results = []
        
        # Process each podcast
        for podcast in podcasts_needing_episodes:
            podcast_id = podcast['podcast_id']
            
            # Fetch the full podcast configuration
            podcast_config = supabase_client.fetch_podcast_config(podcast_config_id=podcast_id)
            
            if not podcast_config:
                print(f"Could not fetch podcast config for podcast {podcast_id}")
                results.append({
                    'podcast_id': podcast_id,
                    'status': 'error',
                    'message': 'Could not fetch podcast config'
                })
                continue
            
            # Create payload for Lambda function
            payload = {
                'podcast_config': podcast_config,
                'sqs_queue_url': sqs_queue_url,
                'trigger_source': 'scheduler'
            }
            
            try:
                # Invoke the Telegram Lambda function
                response = lambda_client.invoke(
                    FunctionName=telegram_lambda_name,
                    InvocationType='Event',
                    Payload=json.dumps(payload)
                )
                
                # Check the response
                if response['StatusCode'] == 202:
                    print(f"Successfully initiated podcast generation for {podcast_id}")
                    results.append({
                        'podcast_id': podcast_id,
                        'status': 'success',
                        'message': 'Podcast generation initiated'
                    })
                else:
                    results.append({
                        'podcast_id': podcast_id,
                        'status': 'error',
                        'message': f"Error invoking Lambda function: {response['StatusCode']}"
                    })
            except Exception as e:
                results.append({
                    'podcast_id': podcast_id,
                    'status': 'error',
                    'message': f"Exception: {str(e)}"
                })
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': f"Processed {len(podcasts_needing_episodes)} podcasts",
                'results': results,
                'timestamp': datetime.now().isoformat()
            })
        }
    
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': f"Error: {str(e)}"
            })
        }
    finally:
        # Close the Supabase client session
        supabase_client.close_session() 