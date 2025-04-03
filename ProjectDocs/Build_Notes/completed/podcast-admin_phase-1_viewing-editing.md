# Task Objective
Implement admin pages for viewing and editing podcasts, following the database schema and project structure.

## Current State Assessment
The admin section has basic podcast listing capabilities but lacks detailed podcast viewing and editing functionality. Currently, podcasts can only be viewed in a table list but cannot be individually edited.

## Future State Goal
Admin users should be able to view detailed information about each podcast and edit podcast metadata (title, description, cover image) through a user-friendly interface. The implementation should follow the existing database schema and adhere to the project's architectural patterns.

## Implementation Plan

1. **Create Podcast Detail/Edit Page**
   - [x] Create a podcast detail page at `/admin/podcasts/[id]/page.tsx`
   - [x] Implement functionality to fetch podcast by ID
   - [x] Design a responsive layout displaying podcast details and statistics
   - [x] Add navigation links to manage podcast episodes

2. **Implement Podcast Edit Form**
   - [x] Create a `PodcastEditForm` component for editing podcast metadata
   - [x] Implement form validation using Zod
   - [x] Add error handling and success notifications
   - [x] Ensure proper state management during form submission

3. **Create Server Actions for Podcast Management**
   - [x] Implement updatePodcast server action
   - [x] Implement deletePodcast server action
   - [x] Add appropriate validation and error handling
   - [x] Add proper revalidation of cached paths
   - [x] Consolidate podcast actions in a single file for better organization

4. **Enhance Podcast Actions Menu**
   - [x] Update the PodcastActionsMenu component to support new actions
   - [x] Add confirmation dialog for delete operations
   - [x] Improve the visual representation of podcast status

5. **Streamline Episode Generation**
   - [x] Replace "New Episode" button with "Generate Episode Now"
   - [x] Create a reusable `GenerateEpisodeButton` component
   - [x] Ensure consistent episode generation functionality across the admin interface
   - [x] Add proper status feedback and error handling

6. **Testing and Refinement**
   - [ ] Test all CRUD operations for podcasts
   - [ ] Verify proper error handling and validation
   - [ ] Ensure responsive design works on all device sizes
   - [ ] Confirm that cache invalidation works correctly after updates

## Completion Summary
The podcast admin viewing and editing functionality has been successfully implemented. The implementation includes a detailed podcast view page, an edit form for podcast metadata, server actions for podcast management, and an enhanced actions menu for podcast-related operations. The implementation follows the database schema and project architecture patterns.

Key features added:
- Detailed podcast view with statistics and cover image display
- Form-based editing of podcast metadata with validation
- Server actions for updating and deleting podcasts
- Confirmation dialogs for destructive operations
- Integration with existing components and API
- Streamlined episode generation through a dedicated button component

## Update Notes
- Consolidated all podcast-related server actions (`createPodcast`, `updatePodcast`, `deletePodcast`, `generatePodcastEpisode`) into a single `podcast-actions.ts` file to avoid duplication and confusion with similar file names.
- Fixed imports in components to reference the consolidated action file.
- Added a helper function `requireAdmin()` to centralize admin validation.
- Replaced the "New Episode" button with a "Generate Episode Now" button that uses the existing episode generation functionality rather than a separate manual creation flow. 