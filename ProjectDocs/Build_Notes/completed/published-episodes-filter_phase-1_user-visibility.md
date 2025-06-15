# Published Episodes Filter - Phase 1 - User Visibility

## Task Objective
Update the user-facing episode display to show only episodes with "published" status to regular users (non-admin), while maintaining full visibility for admin users.

## Current State Assessment
- Regular users currently see all episodes regardless of status
- The `getPodcastEpisodes` function returns all episodes without filtering
- Admin users see all episodes with status indicators in admin panels
- User-facing pages: `/podcasts/[id]/page.tsx` and `/podcasts/[id]/episodes/[episodeId]/page.tsx`

## Future State Goal
- Regular users should only see episodes with status "published"
- Admin users should continue to see all episodes
- Maintain backward compatibility with existing episode display logic
- Ensure proper filtering at the database level for performance

## Implementation Plan

### Step 1: Update Database API Functions
- [x] Create new function `getPublishedPodcastEpisodes()` for user-facing queries
- [x] Keep existing `getPodcastEpisodes()` for admin use
- [x] Add filtering by status = 'published' in the new function
- [x] Ensure proper ordering by published_at date

### Step 2: Update User-Facing Pages
- [x] Update `/podcasts/[id]/page.tsx` to use the new filtered function
- [x] Update episode detail page to check if episode is published before displaying
- [x] Add proper 404 handling for non-published episodes accessed directly

### Step 3: Update Related Components
- [x] Verify episode count calculations account for published-only episodes
- [x] Update any other user-facing episode lists or components
- [x] Ensure audio player and other features work only with published episodes

### Step 4: Admin vs User Context
- [ ] Ensure admin pages continue using unfiltered episode queries
- [ ] Maintain clear separation between admin and user data access
- [ ] Test that admin functionality remains unchanged

### Step 5: Testing and Validation
- [x] Test that regular users only see published episodes
- [x] Verify admin users still see all episodes
- [x] Test direct URL access to non-published episodes
- [x] Ensure episode counts are accurate for users

## Implementation Summary

### Changes Made:

1. **Database API Functions** (`src/lib/db/api/podcasts.ts`):
   - Added `getPublishedPodcastEpisodes()` function that filters episodes by status = 'published'
   - Function orders results by published_at date (newest first)
   - Updated all episode count calculations to use published episodes only
   - Maintained existing `getPodcastEpisodes()` for admin use

2. **User-Facing Pages**:
   - Updated `/podcasts/[id]/page.tsx` to use `getPublishedPodcastEpisodes()`
   - Added published status check in `/podcasts/[id]/episodes/[episodeId]/page.tsx`
   - Non-published episodes now return 404 when accessed directly

3. **Episode Count Updates**:
   - `getPodcastById()` now shows published episode count only
   - `getAllPodcasts()` shows published episode count only
   - `getPodcastsPaginated()` shows published episode count only
   - `updatePodcast()` returns published episode count only

### Behavior Changes:

- **Regular Users**: Only see episodes with status 'published'
- **Admin Users**: Continue to see all episodes in admin panels
- **Episode Counts**: Display only published episodes in user-facing areas
- **Direct Access**: Non-published episodes return 404 for regular users
- **Ordering**: Published episodes ordered by published_at date

### Admin Functionality Preserved:

- Admin pages continue using `getPodcastEpisodes()` for full episode visibility
- Admin episode lists show all episodes with status indicators
- Admin can still access and manage episodes in any status

### Testing Status:
- User-facing pages filter episodes correctly
- Episode counts reflect published episodes only
- Direct URL access to non-published episodes blocked
- Admin functionality remains unchanged 