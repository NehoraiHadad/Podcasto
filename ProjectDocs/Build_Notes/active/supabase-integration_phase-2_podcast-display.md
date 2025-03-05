# Build Notes: Supabase Integration - Podcast Display

## Task Objective
Replace mock podcast data with real data from Supabase database and display it on the podcasts page.

## Current State Assessment
- Podcast page currently uses hardcoded mock data.
- Supabase project is set up with environment variables.
- Database schema is defined but not populated with podcast data.

## Future State Goal
- Fetch podcast data from Supabase database.
- Display real podcast data on the podcasts page.
- Implement proper error handling and loading states.

## Implementation Plan

1. **Create API Functions for Podcast Data**
   - [x] Create a utility function to fetch podcasts from Supabase.
   - [x] Implement error handling for database queries.
   - [x] Add function to get episode counts for each podcast.

2. **Update Podcasts Page**
   - [x] Modify the page to use server components for data fetching.
   - [x] Replace mock data with real data from Supabase.
   - [x] Add conditional rendering for image display.
   - [x] Implement empty state when no podcasts are found.

3. **Testing & Optimization**
   - [x] Implement loading states for better user experience.
   - [ ] Test the integration with the Supabase database.
   - [ ] Verify that podcasts are displayed correctly.
   - [ ] Optimize data fetching with proper caching strategies.

4. **Documentation**
   - [x] Update Build Notes with implementation details.
   - [x] Document the database schema and API functions.
   - [ ] Add instructions for future developers on how to work with the Supabase integration.

## Completion Criteria
- Podcasts page displays real data from Supabase.
- Error handling is implemented for database queries.
- Documentation is updated with implementation details.

## Implementation Details

### Database Schema
The Supabase database has the following tables:
- `podcasts`: Stores podcast metadata (title, description, language, etc.)
- `episodes`: Stores episode data linked to podcasts (title, audio_url, duration, etc.)

### API Functions
- `getPodcasts()`: Fetches all podcasts from the database with episode counts.
- `getPodcastById(id)`: Fetches a single podcast by ID with episode count.

---

_This document tracks the progress of the Supabase integration for podcast display and will be updated as development progresses._ 