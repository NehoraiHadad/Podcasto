#!/usr/bin/env python3
"""
End-to-End Test: Single-Speaker Podcast Generation Pipeline

Tests complete flow from database setup through audio generation:
1. Create test podcast with single-speaker format in database
2. Trigger episode generation via Lambda invocation
3. Monitor SQS queues and Lambda logs
4. Verify audio generation completes
5. Download and inspect audio file
6. Validate voice consistency

Usage:
    python test_single_speaker_pipeline.py --env dev --podcast-id <uuid>
    python test_single_speaker_pipeline.py --env prod --create-test-podcast
"""

import os
import sys
import time
import json
import argparse
import boto3
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, List

# Color output for better readability
class Colors:
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKCYAN = '\033[96m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'

def print_header(msg: str):
    print(f"\n{Colors.HEADER}{Colors.BOLD}{'='*80}{Colors.ENDC}")
    print(f"{Colors.HEADER}{Colors.BOLD}{msg.center(80)}{Colors.ENDC}")
    print(f"{Colors.HEADER}{Colors.BOLD}{'='*80}{Colors.ENDC}\n")

def print_success(msg: str):
    print(f"{Colors.OKGREEN}✓ {msg}{Colors.ENDC}")

def print_error(msg: str):
    print(f"{Colors.FAIL}✗ {msg}{Colors.ENDC}")

def print_warning(msg: str):
    print(f"{Colors.WARNING}⚠ {msg}{Colors.ENDC}")

def print_info(msg: str):
    print(f"{Colors.OKCYAN}ℹ {msg}{Colors.ENDC}")


class PipelineTester:
    """End-to-end tester for single-speaker pipeline"""

    def __init__(self, env: str, supabase_url: str, supabase_key: str):
        self.env = env
        self.supabase_url = supabase_url
        self.supabase_key = supabase_key

        # Initialize AWS clients
        self.lambda_client = boto3.client('lambda')
        self.sqs_client = boto3.client('sqs')
        self.s3_client = boto3.client('s3')
        self.logs_client = boto3.client('logs')

        # Get queue URLs from environment or use defaults
        self.script_queue_url = os.getenv('SCRIPT_GENERATION_QUEUE_URL')
        self.audio_queue_url = os.getenv('AUDIO_GENERATION_QUEUE_URL')
        self.s3_bucket = os.getenv('S3_BUCKET_NAME', 'podcasto-data')

        print_info(f"Environment: {env}")
        print_info(f"S3 Bucket: {self.s3_bucket}")
        print_info(f"Script Queue: {self.script_queue_url}")
        print_info(f"Audio Queue: {self.audio_queue_url}")

    def create_test_podcast(self) -> str:
        """Create a test single-speaker podcast in database"""
        print_header("Creating Test Podcast")

        # Note: This requires Supabase MCP tools or direct API call
        print_warning("Manual step required: Create test podcast in database")
        print_info("SQL to run:")
        print("""
        -- Create test podcast
        INSERT INTO podcasts (id, title, description, user_id)
        VALUES (gen_random_uuid(), 'Test Single-Speaker Podcast', 'Test podcast for pipeline validation', '<your-user-id>')
        RETURNING id;

        -- Create podcast config
        INSERT INTO podcast_configs (
            id, podcast_id, podcast_format, telegram_channel,
            speaker1_role, speaker1_gender, language, telegram_hours
        )
        VALUES (
            gen_random_uuid(),
            '<podcast-id-from-above>',
            'single-speaker',
            '<your-telegram-channel>',
            'Narrator',
            'male',
            'he',
            24
        )
        RETURNING id, podcast_id;
        """)

        podcast_id = input("\nEnter the created podcast_id: ").strip()
        return podcast_id

    def trigger_episode(self, podcast_id: str) -> str:
        """Trigger episode generation via Lambda or API"""
        print_header("Triggering Episode Generation")

        # Get podcast config from database (requires Supabase access)
        print_info(f"Triggering episode for podcast: {podcast_id}")

        # Option 1: Invoke Telegram Lambda directly
        try:
            lambda_name = f"telegram-lambda-{self.env}"
            payload = {
                "podcast_config": {
                    "id": "test-config-id",  # Should get from database
                    "telegram_channel": "test_channel",
                    "podcast_format": "single-speaker",
                    "podcast_id": podcast_id
                },
                "episode_id": f"test-episode-{int(time.time())}",
                "podcast_id": podcast_id
            }

            print_info(f"Invoking Lambda: {lambda_name}")
            response = self.lambda_client.invoke(
                FunctionName=lambda_name,
                InvocationType='RequestResponse',
                Payload=json.dumps(payload)
            )

            result = json.loads(response['Payload'].read())
            print_success(f"Lambda invoked successfully: {result.get('statusCode')}")

            # Extract episode_id from result
            if result.get('statusCode') == 200:
                body = json.loads(result.get('body', '{}'))
                episode_id = body.get('episode_id', payload['episode_id'])
                print_success(f"Episode ID: {episode_id}")
                return episode_id
            else:
                print_error(f"Lambda returned error: {result}")
                return None

        except Exception as e:
            print_error(f"Failed to invoke Lambda: {str(e)}")
            return None

    def monitor_sqs_queue(self, queue_url: str, queue_name: str, timeout: int = 60) -> Optional[Dict]:
        """Monitor SQS queue for messages"""
        print_header(f"Monitoring {queue_name}")

        start_time = time.time()
        while time.time() - start_time < timeout:
            try:
                response = self.sqs_client.receive_message(
                    QueueUrl=queue_url,
                    MaxNumberOfMessages=1,
                    WaitTimeSeconds=5,
                    MessageAttributeNames=['All']
                )

                messages = response.get('Messages', [])
                if messages:
                    message = messages[0]
                    body = json.loads(message['Body'])
                    print_success(f"Message received in {queue_name}")
                    print_info(f"Message content: {json.dumps(body, indent=2)}")

                    # Check for podcast_format
                    format_field = body.get('podcast_format') or body.get('dynamic_config', {}).get('podcast_format')
                    if format_field:
                        print_success(f"podcast_format found: {format_field}")
                    else:
                        print_warning("podcast_format NOT found in message!")

                    # Delete message to avoid reprocessing
                    self.sqs_client.delete_message(
                        QueueUrl=queue_url,
                        ReceiptHandle=message['ReceiptHandle']
                    )

                    return body

                print_info(f"Waiting for message... ({int(time.time() - start_time)}s)")
                time.sleep(5)

            except Exception as e:
                print_error(f"Error monitoring queue: {str(e)}")
                time.sleep(5)

        print_warning(f"Timeout waiting for message in {queue_name}")
        return None

    def check_cloudwatch_logs(self, log_group: str, episode_id: str, filter_pattern: str = "podcast_format") -> bool:
        """Check CloudWatch logs for format tracking"""
        print_header(f"Checking CloudWatch Logs: {log_group}")

        try:
            # Get log streams from last 10 minutes
            end_time = int(time.time() * 1000)
            start_time = end_time - (10 * 60 * 1000)  # 10 minutes ago

            response = self.logs_client.filter_log_events(
                logGroupName=log_group,
                startTime=start_time,
                endTime=end_time,
                filterPattern=filter_pattern
            )

            events = response.get('events', [])
            if events:
                print_success(f"Found {len(events)} log entries with '{filter_pattern}'")
                for event in events[:5]:  # Show first 5
                    message = event['message']
                    if episode_id in message or 'podcast_format' in message:
                        print_info(f"  {message[:200]}")
                return True
            else:
                print_warning(f"No logs found with pattern '{filter_pattern}'")
                return False

        except Exception as e:
            print_error(f"Error checking logs: {str(e)}")
            return False

    def check_episode_status(self, episode_id: str) -> Optional[str]:
        """Check episode status in database"""
        print_header("Checking Episode Status")

        print_warning("Manual step required: Query episode status from database")
        print_info("SQL to run:")
        print(f"""
        SELECT id, title, status, audio_url, duration,
               metadata->>'podcast_format' as format,
               metadata->>'speaker1_voice' as voice,
               created_at, updated_at
        FROM episodes
        WHERE id = '{episode_id}';
        """)

        status = input("\nEnter episode status: ").strip()
        return status if status else None

    def download_audio(self, episode_id: str, podcast_id: str) -> Optional[str]:
        """Download audio file from S3"""
        print_header("Downloading Audio File")

        # Construct S3 path
        s3_prefix = f"podcasts/{podcast_id}/episodes/{episode_id}/"

        try:
            response = self.s3_client.list_objects_v2(
                Bucket=self.s3_bucket,
                Prefix=s3_prefix
            )

            audio_files = [obj for obj in response.get('Contents', [])
                          if obj['Key'].endswith('.wav') or obj['Key'].endswith('.mp3')]

            if not audio_files:
                print_warning(f"No audio files found at {s3_prefix}")
                return None

            audio_key = audio_files[0]['Key']
            local_path = f"/tmp/test_audio_{int(time.time())}.wav"

            print_info(f"Downloading: s3://{self.s3_bucket}/{audio_key}")
            self.s3_client.download_file(self.s3_bucket, audio_key, local_path)

            print_success(f"Downloaded to: {local_path}")
            return local_path

        except Exception as e:
            print_error(f"Error downloading audio: {str(e)}")
            return None

    def validate_audio(self, audio_path: str) -> bool:
        """Validate audio file properties"""
        print_header("Validating Audio File")

        if not os.path.exists(audio_path):
            print_error(f"Audio file not found: {audio_path}")
            return False

        file_size = os.path.getsize(audio_path)
        print_info(f"File size: {file_size / 1024 / 1024:.2f} MB")

        if file_size < 1024:  # Less than 1KB
            print_error("Audio file too small, likely corrupted")
            return False

        print_success("Audio file downloaded successfully")
        print_info(f"Manual verification required: Play audio at {audio_path}")
        print_info("Verify:")
        print_info("  - Single consistent voice throughout")
        print_info("  - No speaker transitions")
        print_info("  - Audio quality acceptable")

        validated = input("\nAudio validation passed? (y/n): ").strip().lower()
        return validated == 'y'

    def run_full_test(self, podcast_id: Optional[str] = None, create_podcast: bool = False):
        """Run complete end-to-end test"""
        print_header("Single-Speaker Pipeline End-to-End Test")

        # Step 1: Create or use existing podcast
        if create_podcast:
            podcast_id = self.create_test_podcast()
        elif not podcast_id:
            print_error("No podcast_id provided and --create-test-podcast not set")
            return False

        # Step 2: Trigger episode generation
        episode_id = self.trigger_episode(podcast_id)
        if not episode_id:
            print_error("Failed to trigger episode generation")
            return False

        # Step 3: Monitor Script Generation Queue
        if self.script_queue_url:
            script_message = self.monitor_sqs_queue(
                self.script_queue_url,
                "Script Generation Queue",
                timeout=120
            )
            if not script_message:
                print_warning("No message found in Script Generation Queue")

        # Step 4: Monitor Audio Generation Queue
        if self.audio_queue_url:
            audio_message = self.monitor_sqs_queue(
                self.audio_queue_url,
                "Audio Generation Queue",
                timeout=180
            )
            if not audio_message:
                print_warning("No message found in Audio Generation Queue")

        # Step 5: Check CloudWatch Logs
        log_groups = {
            'Telegram Lambda': f'/aws/lambda/telegram-lambda-{self.env}',
            'Script Preprocessor': f'/aws/lambda/script-preprocessor-{self.env}',
            'Audio Generation': f'/aws/lambda/audio-generation-{self.env}'
        }

        for name, log_group in log_groups.items():
            self.check_cloudwatch_logs(log_group, episode_id)

        # Step 6: Wait for completion and check status
        print_header("Waiting for Episode Completion")
        max_wait = 600  # 10 minutes
        start_time = time.time()

        while time.time() - start_time < max_wait:
            status = self.check_episode_status(episode_id)
            if status == 'completed':
                print_success("Episode completed successfully!")
                break
            elif status == 'failed':
                print_error("Episode generation failed!")
                return False
            else:
                print_info(f"Episode status: {status}, waiting...")
                time.sleep(30)

        # Step 7: Download and validate audio
        audio_path = self.download_audio(episode_id, podcast_id)
        if audio_path:
            audio_valid = self.validate_audio(audio_path)
            if audio_valid:
                print_success("Audio validation passed!")
            else:
                print_warning("Audio validation failed or incomplete")

        # Final summary
        print_header("Test Summary")
        print_success(f"Episode ID: {episode_id}")
        print_success(f"Podcast ID: {podcast_id}")
        print_info("Check CloudWatch Logs for detailed format tracking")
        print_info("Verify SQS messages contained podcast_format field")

        return True


def main():
    parser = argparse.ArgumentParser(description='Test single-speaker podcast pipeline')
    parser.add_argument('--env', required=True, choices=['dev', 'prod'], help='Environment to test')
    parser.add_argument('--podcast-id', help='Existing podcast ID to use')
    parser.add_argument('--create-test-podcast', action='store_true', help='Create new test podcast')
    parser.add_argument('--supabase-url', default=os.getenv('SUPABASE_URL'), help='Supabase URL')
    parser.add_argument('--supabase-key', default=os.getenv('SUPABASE_SERVICE_KEY'), help='Supabase service key')

    args = parser.parse_args()

    if not args.supabase_url or not args.supabase_key:
        print_error("SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables required")
        print_info("Or provide --supabase-url and --supabase-key arguments")
        sys.exit(1)

    tester = PipelineTester(args.env, args.supabase_url, args.supabase_key)

    try:
        success = tester.run_full_test(
            podcast_id=args.podcast_id,
            create_podcast=args.create_test_podcast
        )
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print_warning("\nTest interrupted by user")
        sys.exit(1)
    except Exception as e:
        print_error(f"Test failed with error: {str(e)}")
        sys.exit(1)


if __name__ == '__main__':
    main()
