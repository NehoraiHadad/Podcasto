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

### 2. **Episodes** (`episodes`)
Stores details about individual podcast episodes.

| Column       | Type         | Description                         |
|-------------|------------|---------------------------------|
| id         | UUID       | Primary Key                     |
| podcast_id | UUID       | Foreign Key to `podcasts`       |
| title      | TEXT       | Episode title                   |
| description   TEXT      | Episode description             |
| language    |  TEXT     | Episode language                |
| audio_url  | VARCHAR    | URL to the stored audio file    |
| duration   | INTEGER    | Episode length in seconds       |
| created_at | TIMESTAMP  | Episode creation timestamp      |
| published_at | TIMESTAMP  | Last update timestamp          |

### 3. **Subscriptions** (`subscriptions`)
Tracks which users are subscribed to which podcasts.

| Column      | Type     | Description                           |
|------------|--------|----------------------------------|
| id        | UUID   | Primary Key                      |
| user_id   | UUID   | Foreign Key to `users`         |
| podcast_id | UUID   | Foreign Key to `podcasts`      |
| created_at | TIMESTAMP | Subscription creation timestamp |

### 4. **Sent Episodes** (`sent_episodes`)
Tracks episodes that have been emailed to users.

| Column       | Type     | Description                             |
|-------------|--------|----------------------------------|
| id         | UUID   | Primary Key                      |
| user_id    | UUID   | Foreign Key to `users`         |
| episode_id | UUID   | Foreign Key to `episodes`      |
| sent_at    | TIMESTAMP | Timestamp when the episode was sent |

## Webhooks & Triggers
- **Episode Creation Trigger**: Automatically notifies subscribers via email when a new episode is generated.
- **Daily Podcast Generation Job**: Runs a scheduled process to generate a podcast every day.
- **User Subscription Sync**: Ensures subscription data remains up to date in external podcast hosting services.

This schema ensures an optimized, scalable, and structured approach to podcast and user data management.
