# Build Notes: Supabase Integration

## Task Objective
Integrate Supabase as the primary backend for authentication, data storage, and real-time updates.

## Current State Assessment
- No Supabase integration implemented.
- User authentication, podcast metadata, and subscriptions need structured storage.
- Real-time updates for podcast releases and subscriptions are not yet functional.

## Future State Goal
- Authenticate users via Supabase (Google OAuth, email/password).
- Store and manage **users, podcasts, episodes, and subscriptions** in Supabase.
- Implement **real-time updates** for new podcast releases.
- Ensure **secure API calls** and optimize database queries.

## Implementation Plan

1. **Supabase Project Setup**
   - Create a new project on Supabase.
   - Configure authentication (Google OAuth, email/password).
   - Set up environment variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`).

2. **Database Schema & Tables**
   - Define tables: `users`, `podcasts`, `episodes`, `subscriptions`, `sent_episodes`.
   - Implement foreign key constraints and indexing for performance.
   - Enable Row-Level Security (RLS) to protect user data.

3. **User Authentication**
   - Implement **Google OAuth and email/password authentication**.
   - Configure Supabase Auth UI or custom login forms.
   - Store user session securely on the frontend (Next.js state management with Zustand).

4. **Podcast & Episode Storage**
   - Store podcast metadata (title, description, language, created_at).
   - Store episodes with audio file references (stored in Podbean).
   - Implement Supabase storage for potential additional assets (e.g., transcripts, images).

5. **Real-Time Updates & Webhooks**
   - Enable **real-time database listening** for new episodes.
   - Notify subscribed users when a new episode is available.
   - Set up **webhooks** for automated processing of new content.

6. **Testing & Optimization**
   - Ensure **secure API access** (limit public API exposure).
   - Optimize database queries and indexing.
   - Monitor and test real-time updates across devices.

## Completion Criteria
- Users can authenticate securely with Supabase.
- Podcasts, episodes, and subscriptions are fully managed within Supabase.
- Real-time notifications for new podcast episodes are functional.
- API queries are optimized and secured.

---

_This document tracks the progress of the Supabase integration and will be updated as development progresses._
