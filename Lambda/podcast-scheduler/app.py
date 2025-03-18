"""
Podcast Scheduler Lambda Function

This Lambda function checks which podcasts need new episodes based on their frequency
and triggers the appropriate Lambda functions to generate them.
"""
import json
import os
import boto3
import requests
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional

# Initialize AWS clients
lambda_client = boto3.client('lambda')

class SupabaseClient:
    """
    A simple Supabase client for the Lambda function.
    """
    
    def __init__(self):
        """Initialize the Supabase client with environment variables."""
        self.supabase_url = os.getenv('SUPABASE_URL')
        self.supabase_key = os.getenv('SUPABASE_KEY')
        
        if not self.supabase_url or not self.supabase_key:
            raise ValueError("SUPABASE_URL and SUPABASE_KEY environment variables must be set")
        
        self.headers = {
            'apikey': self.supabase_key,
            'Authorization': f'Bearer {self.supabase_key}',
            'Content-Type': 'application/json'
        }
    
    def check_podcasts_for_new_episodes(self) -> List[Dict[str, Any]]:
        """
        Call the database function to check which podcasts need new episodes.
        
        Returns:
        --------
        List[Dict[str, Any]]
            List of podcasts that need new episodes
        """
        url = f"{self.supabase_url}/rest/v1/rpc/check_podcasts_for_new_episodes"
        
        response = requests.post(url, headers=self.headers)
        
        if response.status_code != 200:
            print(f"Error checking podcasts for new episodes: {response.status_code} - {response.text}")
            return []
        
        return response.json()
    
    def fetch_podcast_config(self, podcast_id: str) -> Optional[Dict[str, Any]]:
        """
        Fetch the podcast configuration for a specific podcast.
        
        Parameters:
        -----------
        podcast_id: str
            The ID of the podcast
        
        Returns:
        --------
        Optional[Dict[str, Any]]
            The podcast configuration or None if not found
        """
        url = f"{self.supabase_url}/rest/v1/podcast_configs"
        params = {
            'select': '*',
            'podcast_id': f'eq.{podcast_id}'
        }
        
        response = requests.get(url, headers=self.headers, params=params)
        
        if response.status_code != 200:
            print(f"Error fetching podcast config: {response.status_code} - {response.text}")
            return None
        
        results = response.json()
        return results[0] if results else None
    
    def create_episode(self, podcast_id: str, title: str, audio_url: str, description: str = None, language: str = 'english') -> Optional[Dict[str, Any]]:
        """
        Create a new episode in the database.
        
        Parameters:
        -----------
        podcast_id: str
            The ID of the podcast
        title: str
            The title of the episode
        audio_url: str
            The URL of the audio file
        description: str, optional
            The description of the episode
        language: str, optional
            The language of the episode
        
        Returns:
        --------
        Optional[Dict[str, Any]]
            The created episode or None if creation failed
        """
        url = f"{self.supabase_url}/rest/v1/episodes"
        
        data = {
            'podcast_id': podcast_id,
            'title': title,
            'audio_url': audio_url,
            'description': description,
            'language': language,
            'published_at': datetime.now().isoformat()
        }
        
        response = requests.post(url, headers=self.headers, json=data)
        
        if response.status_code != 201:
            print(f"Error creating episode: {response.status_code} - {response.text}")
            return None
        
        return response.json()

def trigger_telegram_lambda(podcast_config: Dict[str, Any]) -> Dict[str, Any]:
    """
    Trigger the Telegram Lambda function to collect data for a podcast.
    
    Parameters:
    -----------
    podcast_config: Dict[str, Any]
        The podcast configuration
    
    Returns:
    --------
    Dict[str, Any]
        The response from the Lambda function
    """
    # Get the Telegram Lambda function name from environment variables
    telegram_lambda_name = os.getenv('TELEGRAM_LAMBDA_NAME')
    
    if not telegram_lambda_name:
        print("TELEGRAM_LAMBDA_NAME environment variable not set")
        return {"error": "TELEGRAM_LAMBDA_NAME environment variable not set"}
    
    # Prepare the event for the Telegram Lambda function
    event = {
        'podcast_config': podcast_config
    }
    
    # Invoke the Telegram Lambda function
    try:
        response = lambda_client.invoke(
            FunctionName=telegram_lambda_name,
            InvocationType='RequestResponse',
            Payload=json.dumps(event)
        )
        
        payload = json.loads(response['Payload'].read().decode())
        return payload
    
    except Exception as e:
        print(f"Error invoking Telegram Lambda function: {e}")
        return {"error": str(e)}

def trigger_audio_generation_lambda(podcast_config: Dict[str, Any], content_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Trigger the Audio Generation Lambda function to generate a podcast episode.
    
    Parameters:
    -----------
    podcast_config: Dict[str, Any]
        The podcast configuration
    content_data: Dict[str, Any]
        The content data collected by the Telegram Lambda function
    
    Returns:
    --------
    Dict[str, Any]
        The response from the Lambda function
    """
    # Get the Audio Generation Lambda function name from environment variables
    audio_lambda_name = os.getenv('AUDIO_LAMBDA_NAME')
    
    if not audio_lambda_name:
        print("AUDIO_LAMBDA_NAME environment variable not set")
        return {"error": "AUDIO_LAMBDA_NAME environment variable not set"}
    
    # Prepare the event for the Audio Generation Lambda function
    event = {
        'podcast_config': podcast_config,
        'content_data': content_data
    }
    
    # Invoke the Audio Generation Lambda function
    try:
        response = lambda_client.invoke(
            FunctionName=audio_lambda_name,
            InvocationType='RequestResponse',
            Payload=json.dumps(event)
        )
        
        payload = json.loads(response['Payload'].read().decode())
        return payload
    
    except Exception as e:
        print(f"Error invoking Audio Generation Lambda function: {e}")
        return {"error": str(e)}

def lambda_handler(event, context):
    """
    Lambda function handler
    
    Parameters:
    -----------
    event: dict
        Event data
    context: object
        Lambda context
    
    Returns:
    --------
    dict
        Response
    """
    try:
        print(f"Received event: {json.dumps(event)}")
        
        # Initialize the Supabase client
        supabase_client = SupabaseClient()
        
        # Check which podcasts need new episodes
        podcasts_needing_episodes = supabase_client.check_podcasts_for_new_episodes()
        
        if not podcasts_needing_episodes:
            print("No podcasts need new episodes")
            return {
                'statusCode': 200,
                'body': json.dumps({
                    'message': 'No podcasts need new episodes'
                })
            }
        
        # Process each podcast that needs a new episode
        results = []
        for podcast in podcasts_needing_episodes:
            podcast_id = podcast['podcast_id']
            content_source = podcast['content_source']
            
            print(f"Processing podcast {podcast_id} with content source {content_source}")
            
            # Fetch the full podcast configuration
            podcast_config = supabase_client.fetch_podcast_config(podcast_id)
            
            if not podcast_config:
                print(f"Could not fetch podcast config for podcast {podcast_id}")
                results.append({
                    'podcast_id': podcast_id,
                    'status': 'error',
                    'message': 'Could not fetch podcast config'
                })
                continue
            
            # Generate episode title with date
            episode_date = datetime.now().strftime("%Y-%m-%d")
            episode_title = f"{podcast_config.get('podcast_name', 'Podcast')} - {episode_date}"
            
            # Process based on content source
            if content_source == 'telegram':
                # Trigger the Telegram Lambda function
                telegram_result = trigger_telegram_lambda(podcast_config)
                
                if 'error' in telegram_result:
                    print(f"Error from Telegram Lambda: {telegram_result['error']}")
                    results.append({
                        'podcast_id': podcast_id,
                        'status': 'error',
                        'message': f"Error from Telegram Lambda: {telegram_result['error']}"
                    })
                    continue
                
                # Extract the content data from the Telegram Lambda result
                body = json.loads(telegram_result.get('body', '{}'))
                all_results = body.get('results', {})
                podcast_result = all_results.get(podcast_config['id'], {})
                content_data = podcast_result.get('results', {})
                
                if not content_data:
                    print(f"No content data found for podcast {podcast_id}")
                    results.append({
                        'podcast_id': podcast_id,
                        'status': 'error',
                        'message': 'No content data found'
                    })
                    continue
                
                # Trigger the Audio Generation Lambda function
                audio_result = trigger_audio_generation_lambda(podcast_config, content_data)
                
                if 'error' in audio_result:
                    print(f"Error from Audio Generation Lambda: {audio_result['error']}")
                    results.append({
                        'podcast_id': podcast_id,
                        'status': 'error',
                        'message': f"Error from Audio Generation Lambda: {audio_result['error']}"
                    })
                    continue
                
                # Extract the audio URL from the result
                body = json.loads(audio_result.get('body', '{}'))
                audio_url = body.get('audio_url')
                
                if not audio_url:
                    print(f"No audio URL found in result for podcast {podcast_id}")
                    results.append({
                        'podcast_id': podcast_id,
                        'status': 'error',
                        'message': 'No audio URL found in result'
                    })
                    continue
                
                # Create the episode in the database
                episode = supabase_client.create_episode(
                    podcast_id=podcast_id,
                    title=episode_title,
                    audio_url=audio_url,
                    description=f"Episode generated from Telegram content on {episode_date}",
                    language=podcast_config.get('output_language', 'english')
                )
                
                results.append({
                    'podcast_id': podcast_id,
                    'status': 'success' if episode else 'error',
                    'message': 'Episode created successfully' if episode else 'Failed to create episode',
                    'episode_id': episode.get('id') if episode else None,
                    'audio_url': audio_url
                })
            
            elif content_source == 'urls':
                # For URL source, we can directly trigger the Audio Generation Lambda
                # since we already have the URLs in the podcast config
                audio_result = trigger_audio_generation_lambda(podcast_config, {
                    'urls': podcast_config.get('urls', [])
                })
                
                if 'error' in audio_result:
                    print(f"Error from Audio Generation Lambda: {audio_result['error']}")
                    results.append({
                        'podcast_id': podcast_id,
                        'status': 'error',
                        'message': f"Error from Audio Generation Lambda: {audio_result['error']}"
                    })
                    continue
                
                # Extract the audio URL from the result
                body = json.loads(audio_result.get('body', '{}'))
                audio_url = body.get('audio_url')
                
                if not audio_url:
                    print(f"No audio URL found in result for podcast {podcast_id}")
                    results.append({
                        'podcast_id': podcast_id,
                        'status': 'error',
                        'message': 'No audio URL found in result'
                    })
                    continue
                
                # Create the episode in the database
                episode = supabase_client.create_episode(
                    podcast_id=podcast_id,
                    title=episode_title,
                    audio_url=audio_url,
                    description=f"Episode generated from URLs on {episode_date}",
                    language=podcast_config.get('output_language', 'english')
                )
                
                results.append({
                    'podcast_id': podcast_id,
                    'status': 'success' if episode else 'error',
                    'message': 'Episode created successfully' if episode else 'Failed to create episode',
                    'episode_id': episode.get('id') if episode else None,
                    'audio_url': audio_url
                })
            
            else:
                print(f"Unsupported content source: {content_source}")
                results.append({
                    'podcast_id': podcast_id,
                    'status': 'error',
                    'message': f"Unsupported content source: {content_source}"
                })
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Processing completed',
                'results': results
            })
        }
    
    except Exception as e:
        print(f"Error in lambda_handler: {e}")
        import traceback
        traceback.print_exc()
        
        return {
            'statusCode': 500,
            'body': json.dumps({
                'message': f'Error: {str(e)}'
            })
        } 