#!/usr/bin/env python
"""
Script to generate a Telegram session string.
"""
from telethon.sync import TelegramClient
from telethon.sessions import StringSession
import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def generate_session():
    """Generate a Telegram session string."""
    # Get API credentials from environment variables or command line
    api_id = os.getenv('TELEGRAM_API_ID') or input("Enter your Telegram API ID: ")
    api_hash = os.getenv('TELEGRAM_API_HASH') or input("Enter your Telegram API hash: ")
    
    if not api_id or not api_hash:
        print("Error: API ID and API hash are required.")
        sys.exit(1)
    
    # Create a new Telegram client
    with TelegramClient(StringSession(), api_id, api_hash) as client:
        print("Please log in to your Telegram account")
        client.start()
        
        # Get the session string
        session_string = client.session.save()
        
        print("\nYour session string is:")
        print(session_string)
        print("\nStore this string securely. It provides access to your Telegram account.")
        print("You can set it as the TELEGRAM_SESSION environment variable.")

if __name__ == "__main__":
    generate_session() 