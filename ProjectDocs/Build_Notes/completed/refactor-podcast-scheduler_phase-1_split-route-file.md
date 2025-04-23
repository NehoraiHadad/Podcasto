# Build Notes: Refactor Podcast Scheduler API Route

**Build Title:** Refactor Podcast Scheduler
**Phase:** 1
**Task Group:** Split Route File

## Task Objective

Refactor the `Podcasto/src/app/api/cron/podcast-scheduler/route.ts` file to improve maintainability and adhere to the project's code quality guidelines by splitting it into smaller, focused modules.

## Current State Assessment

The `route.ts` file currently handles authorization, database querying to find podcasts needing episodes, and the logic to trigger episode generation within a single `GET` handler and associated helper functions. This results in a file exceeding the 150-line limit and mixing different concerns.

## Future State Goal

The podcast scheduling logic will be modularized. The main `route.ts` file will primarily handle the incoming request, authorization, and orchestrate calls to separate modules responsible for finding podcasts and generating episodes. This will result in shorter, more focused files that are easier to understand and maintain.

## Implementation Plan

1.  **Create Module Directory:**
    *   [x] Create a new directory: `Podcasto/src/lib/podcast-scheduler/`

2.  **Create Types File:**
    *   [x] Create `Podcasto/src/lib/podcast-scheduler/types.ts`.
    *   [x] Move the `PodcastScheduleData` and `PodcastSqlRow` interfaces from `route.ts` to `types.ts`.
    *   [x] Export the interfaces from `types.ts`.
    *   [x] Update `route.ts` to import these types from the new file.

3.  **Extract Podcast Finder Logic:**
    *   [x] Create `Podcasto/src/lib/podcast-scheduler/finder.ts`.
    *   [x] Move the `findPodcastsNeedingEpisodes` function from `route.ts` to `finder.ts`.
    *   [x] Add necessary imports to `finder.ts` (e.g., `db`, `sql`, types from `./types`).
    *   [x] Export the `findPodcastsNeedingEpisodes` function from `finder.ts`.
    *   [x] Update `route.ts` to import `findPodcastsNeedingEpisodes` from the new file.
    *   [x] Update `route.ts` to remove the old local function definition.

4.  **Extract Episode Generation Logic:**
    *   [x] Create `Podcasto/src/lib/podcast-scheduler/generator.ts`.
    *   [x] Move the `generateEpisodesForPodcasts` function from `route.ts` to `generator.ts`.
    *   [x] Add necessary imports to `generator.ts` (e.g., `generatePodcastEpisode`, types from `./types`, `fetch`).
    *   [x] Export the `generateEpisodesForPodcasts` function from `generator.ts`.
    *   [x] Update `route.ts` to import `generateEpisodesForPodcasts` from the new file.
    *   [x] Update `route.ts` to remove the old local function definition.

5.  **Refine `route.ts`:**
    *   [x] Ensure all necessary imports are present (`NextRequest`, `NextResponse`, `revalidatePath`, the new modules, types).
    *   [x] Remove unused imports (like `db`, `sql`, `PodcastSqlRow`).
    *   [x] Verify the logic flow within the `GET` handler remains correct.
    *   [x] Check file length to ensure it's closer to the desired limit (now ~90 lines).

6.  **Testing:**
    *   [ ] Manually trigger the cron job endpoint (if possible in dev) or monitor the next scheduled run to ensure it functions correctly after refactoring.
    *   [ ] Check logs for any errors. 