# Database Schema

## Overview
This document outlines the database schema used to store and manage user data, podcasts, episodes, and subscriptions.

## Tables

### 1. **Podcasts** (`podcasts`)
Stores metadata about each generated podcast.

| Column       | Type         | Description                       |
|-------------|------------|--------------------------------|
| id         | UUID       | Primary Key                     |
| title      | TEXT    | Podcast title                   |
| description | TEXT       | Podcast description             |
| cover_image   | TEXT    | Image of the podcast         |
| created_at | TIMESTAMP  | Podcast creation timestamp      |
| updated_at | TIMESTAMP  | Last update timestamp          |

### 2. **Podcast Configurations** (`podcast_configs`)
Stores configuration settings for podcast generation.

| Column                  | Type       | Description                                     |
|------------------------|------------|-------------------------------------------------|
| id                     | UUID       | Primary Key                                     |
| podcast_id             | UUID       | Foreign Key to `podcasts`                       |
| content_source         | TEXT       | Source of content (telegram, urls)              |
| telegram_channel       | TEXT       | Telegram channel for content (if applicable)    |
| telegram_hours         | INTEGER    | Hours of Telegram history to collect            |
| urls                   | JSONB      | Array of URLs for content (if applicable)       |
| creator                | TEXT       | Name of the podcast creator                     |
| podcast_name           | TEXT       | Display name of the podcast                     |
| slogan                 | TEXT       | Podcast tagline                                 |
| creativity_level       | INTEGER    | AI creativity level (0-100)                     |
| is_long_podcast        | BOOLEAN    | Whether the podcast is longform                 |
| discussion_rounds      | INTEGER    | Number of discussion segments                   |
| min_chars_per_round    | INTEGER    | Minimum characters per discussion segment       |
| conversation_style     | TEXT       | Style of conversation (engaging, formal, etc.)  |
| speaker1_role          | TEXT       | Role of first speaker                           |
| speaker2_role          | TEXT       | Role of second speaker                          |
| mixing_techniques      | JSONB      | Array of engagement techniques                  |
| additional_instructions| TEXT       | Custom instructions for generation              |
| episode_frequency      | INTEGER    | Days between episode generations (default: 7)   |
| created_at             | TIMESTAMP  | Configuration creation timestamp                |
| updated_at             | TIMESTAMP  | Last update timestamp                           |

### 3. **Episodes** (`episodes`)
Stores details about individual podcast episodes.

| Column       | Type         | Description                         |
|-------------|------------|---------------------------------|
| id         | UUID       | Primary Key                     |
| podcast_id | UUID       | Foreign Key to `podcasts`       |
| title      | TEXT       | Episode title                   |
| description   TEXT      | Episode description             |
| cover_image | TEXT      | Image of the episode            |
| language    |  TEXT     | Episode language                |
| audio_url  | VARCHAR    | URL to the stored audio file    |
| duration   | INTEGER    | Episode length in seconds       |
| created_at | TIMESTAMP  | Episode creation timestamp      |
| published_at | TIMESTAMP  | Last update timestamp          |
| status     | TEXT       | Processing status (pending, completed, etc.) |
| metadata_url | TEXT      | URL to episode source metadata   |
| source_data_ref | TEXT    | Reference to timestamp-based source data |

### 4. **Subscriptions** (`subscriptions`)
Tracks which users are subscribed to which podcasts.

| Column      | Type     | Description                           |
|------------|--------|----------------------------------|
| id        | UUID   | Primary Key                      |
| user_id   | UUID   | Foreign Key to `users`         |
| podcast_id | UUID   | Foreign Key to `podcasts`      |
| created_at | TIMESTAMP | Subscription creation timestamp |

### 5. **Sent Episodes** (`sent_episodes`)
Tracks episodes that have been emailed to users.

| Column       | Type     | Description                             |
|-------------|--------|----------------------------------|
| id         | UUID   | Primary Key                      |
| user_id    | UUID   | Foreign Key to `users`         |
| episode_id | UUID   | Foreign Key to `episodes`      |
| sent_at    | TIMESTAMP | Timestamp when the episode was sent |


### 6. **User Roles** (`user_roles`)

| Column       | Type     | Description                             |
|-------------|--------|----------------------------------|
| id         | UUID   | Primary Key                      |
| user_id    | UUID   | Foreign Key to `users`         |
| role | TEXT   | user or admin     |
| created_at    | TIMESTAMP | Timestamp when the user register |


## Webhooks & Triggers
- **Episode Creation Trigger**: Automatically notifies subscribers via email when a new episode is generated.
- **Daily Podcast Generation Job**: Runs a scheduled process to generate a podcast every day.
- **User Subscription Sync**: Ensures subscription data remains up to date in external podcast hosting services.

This schema ensures an optimized, scalable, and structured approach to podcast and user data management.
