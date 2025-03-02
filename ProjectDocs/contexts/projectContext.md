# Project Context

## Overview
The purpose of this project is to transform daily news content from Telegram channels into accessible podcasts. These podcasts will be generated automatically every day based on the content collected from the previous day and sent to users via email.

## Technology Stack
The project will leverage the following technologies:

| Technology    | Purpose                           |
|--------------|----------------------------------|
| **Next.js 15 with RSC** | Web App  |
| **PostgreSQL (Supabase)** | Database Layer |
| **Vercel** | Deployment + CI/CD |
| **Tailwind & Shadcn** | UI Styling |
| **Mailgun** | Email Delivery |
| **Telethon** | Telegram API Integration |
| **Podbean** | Audio File Storage |
| **Supabase** | Authentication |
| **AWS Lambda** | Running Podcastfy for podcast creation |

## Integrations
- **Telegram API (Telethon):** Fetches content from predefined Telegram channels.
- **Supabase:** Stores user data, podcast metadata, and authentication.
- **Mailgun:** Sends daily podcasts to subscribed users via email.
- **Podbean:** Stores and serves generated podcast audio files.
- **AWS Lambda:** Runs the Podcastfy library for automated podcast generation.

## Technical Challenges
- **AWS Lambda Setup:** Efficiently running Podcastfy and scheduling daily podcast generation.
- **Handling Multi-Language Support:** Podcastfy supports multiple languages, and the feasibility of integrating OpenAI’s advanced voice model for Hebrew is under consideration.
- **Efficient Telegram Data Processing:** Converting Telegram messages (text, images, and links) into a structured podcast format.
- **Daily Automated Scheduling:** Ensuring the pipeline runs on a strict daily schedule to generate and distribute the podcast on time.

## Next Steps
- **Refine project structure and context documentation.**
- **Implement authentication flow with Supabase.**
- **Develop API integrations with Telegram, Supabase, Mailgun, and Podbean.**
- **Deploy the automated AWS Lambda function for podcast generation.**
- **Test and optimize the full pipeline from content ingestion to podcast delivery.**
