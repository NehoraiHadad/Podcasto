"""
SES Notification Handler Lambda
Handles bounce and complaint notifications from AWS SES via SNS
"""
import json
import os
import logging
from typing import Dict, Any, Optional
import boto3
import psycopg2
from psycopg2.extras import RealDictCursor

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Cache secrets
_secrets_cache = None

def get_secrets():
    """Retrieve secrets from AWS Secrets Manager"""
    global _secrets_cache
    if _secrets_cache:
        return _secrets_cache

    secret_name = os.environ['SECRETS_MANAGER_NAME']
    # AWS_REGION is automatically set by Lambda, use it directly
    region = 'us-east-1'  # Or get from Lambda env: os.environ.get('AWS_DEFAULT_REGION', 'us-east-1')

    client = boto3.client('secretsmanager', region_name=region)
    response = client.get_secret_value(SecretId=secret_name)
    _secrets_cache = json.loads(response['SecretString'])
    return _secrets_cache

def get_db_connection():
    """Create database connection to Supabase"""
    secrets = get_secrets()

    # Extract DB URL and parse it
    # Format: postgresql://postgres:[PASSWORD]@host:port/postgres
    db_url = secrets['DATABASE_URL']

    return psycopg2.connect(db_url)

def extract_recipient_email(message: Dict[str, Any]) -> Optional[str]:
    """Extract recipient email from SNS message"""
    try:
        if 'bounce' in message:
            recipients = message['bounce'].get('bouncedRecipients', [])
        elif 'complaint' in message:
            recipients = message['complaint'].get('complainedRecipients', [])
        else:
            return None

        if recipients and len(recipients) > 0:
            return recipients[0].get('emailAddress')
    except (KeyError, IndexError) as e:
        logger.error(f"Error extracting email: {e}")
    return None

def find_user_by_email(conn, email: str) -> Optional[str]:
    """Find user ID by email address"""
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            # Check profiles table (has email from Supabase Auth)
            cursor.execute("""
                SELECT u.id
                FROM auth.users u
                WHERE u.email = %s
                LIMIT 1
            """, (email,))
            result = cursor.fetchone()
            return result['id'] if result else None
    except Exception as e:
        logger.error(f"Error finding user by email {email}: {e}")
        return None

def handle_bounce(conn, message: Dict[str, Any], email: str, user_id: str):
    """Handle bounce notification"""
    bounce = message.get('bounce', {})
    bounce_type = bounce.get('bounceType')  # Permanent, Transient
    bounce_sub_type = bounce.get('bounceSubType')  # General, NoEmail, Suppressed, etc.

    logger.info(f"Processing bounce: type={bounce_type}, subType={bounce_sub_type}, email={email}")

    # Insert bounce record
    with conn.cursor() as cursor:
        cursor.execute("""
            INSERT INTO email_bounces (user_id, email, event_type, bounce_type, sub_type, raw_message)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (user_id, email, 'bounce', bounce_type, bounce_sub_type, json.dumps(message)))

    # Disable email notifications for hard bounces (Permanent)
    if bounce_type == 'Permanent':
        logger.info(f"Disabling email notifications for user {user_id} due to permanent bounce")
        with conn.cursor() as cursor:
            cursor.execute("""
                UPDATE profiles
                SET email_notifications = false
                WHERE id::text = %s::text
            """, (user_id,))

def handle_complaint(conn, message: Dict[str, Any], email: str, user_id: str):
    """Handle complaint notification"""
    complaint = message.get('complaint', {})
    complaint_feedback_type = complaint.get('complaintFeedbackType')  # abuse, fraud, etc.

    logger.info(f"Processing complaint: type={complaint_feedback_type}, email={email}")

    # Insert complaint record
    with conn.cursor() as cursor:
        cursor.execute("""
            INSERT INTO email_bounces (user_id, email, event_type, sub_type, raw_message)
            VALUES (%s, %s, %s, %s, %s)
        """, (user_id, email, 'complaint', complaint_feedback_type, json.dumps(message)))

    # Always disable email notifications for complaints
    logger.info(f"Disabling email notifications for user {user_id} due to complaint")
    with conn.cursor() as cursor:
        cursor.execute("""
            UPDATE profiles
            SET email_notifications = false
            WHERE id::text = %s::text
        """, (user_id,))

def lambda_handler(event, context):
    """
    Lambda handler for SNS notifications from SES
    """
    logger.info(f"Received event: {json.dumps(event)}")

    conn = None
    try:
        conn = get_db_connection()

        # SNS sends records in 'Records' array
        for record in event.get('Records', []):
            # Parse SNS message
            sns_message = json.loads(record['Sns']['Message'])

            # Extract email address
            email = extract_recipient_email(sns_message)
            if not email:
                logger.warning("Could not extract email from message")
                continue

            # Find user by email
            user_id = find_user_by_email(conn, email)
            if not user_id:
                logger.warning(f"User not found for email: {email}")
                continue

            # Handle bounce or complaint
            if 'bounce' in sns_message:
                handle_bounce(conn, sns_message, email, user_id)
            elif 'complaint' in sns_message:
                handle_complaint(conn, sns_message, email, user_id)
            else:
                logger.warning("Unknown message type")
                continue

            conn.commit()
            logger.info(f"Successfully processed notification for {email}")

        return {
            'statusCode': 200,
            'body': json.dumps('Notifications processed successfully')
        }

    except Exception as e:
        logger.error(f"Error processing notification: {e}", exc_info=True)
        if conn:
            conn.rollback()
        raise

    finally:
        if conn:
            conn.close()
