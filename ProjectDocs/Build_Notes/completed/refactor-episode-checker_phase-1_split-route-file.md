# Build Notes: Refactor Episode Checker API Route

**Build Title:** Refactor Episode Checker
**Phase:** 1
**Task Group:** Split Route File

## Task Objective

Refactor the `Podcasto/src/app/api/cron/episode-checker/route.ts` file to improve maintainability, testability, and adherence to project code quality guidelines by separating concerns into distinct modules.

## Current State Assessment

The `route.ts` file contains logic for authorization, fetching single or multiple episodes, status checking (timeouts, completion), database updates, integration with a post-processing service, path revalidation, and constants/types definition. This results in a large file (approx. 390 lines) with tightly coupled logic.

## Future State Goal

The episode checking logic will be modularized. The main `route.ts` file will handle request routing, authorization, and orchestration. Separate modules will manage:
*   Constants and types.
*   Fetching episodes from the database.
*   Creating the post-processing service instance.
*   The core logic for checking and processing a single episode's status.
This will lead to smaller, more manageable files aligned with project standards.

## Implementation Plan

1.  **Create Module Directory:**
    *   [x] Create a new directory: `Podcasto/src/lib/episode-checker/`

2.  **Create `types.ts`:**
    *   [x] Create `Podcasto/src/lib/episode-checker/types.ts`.
    *   [x] Move the `EpisodeCheckResults` interface from `route.ts` to `types.ts`.
    *   [x] Export the interface.
    *   [x] Update `route.ts` to import the type.

3.  **Create `constants.ts`:**
    *   [x] Create `Podcasto/src/lib/episode-checker/constants.ts`.
    *   [x] Move status constants (`PENDING_STATUS`, `COMPLETED_STATUS`, etc.) and time constants (`MAX_PENDING_TIME`) from `route.ts` to `constants.ts`.
    *   [x] Export the constants.
    *   [x] Update `route.ts` and other relevant new modules to import constants.

4.  **Create `service-factory.ts`:**
    *   [x] Create `Podcasto/src/lib/episode-checker/service-factory.ts`.
    *   [x] Move the `getPostProcessingService` function from `route.ts` to `service-factory.ts`.
    *   [x] Add necessary imports (`createPostProcessingService`).
    *   [x] Export the function.
    *   [x] Update `route.ts` to import and use this factory function.

5.  **Create `finder.ts`:**
    *   [x] Create `Podcasto/src/lib/episode-checker/finder.ts`.
    *   [x] Create a function `findEpisodeById(episodeId: string)` to fetch a single episode. Include necessary imports (`db`, `episodes`, `eq`).
    *   [x] Create a function `findAllEpisodesToCheck()` to fetch all pending or completed episodes suitable for batch checking. Include necessary imports (`db`, `episodes`, `or`, `eq`, constants).
    *   [x] Corrected `Episode` type import using `InferSelectModel`.
    *   [x] Export both functions.
    *   [x] Update `route.ts` to use these finder functions instead of direct DB calls in the handlers.

6.  **Create `processor.ts`:**
    *   [x] Create `Podcasto/src/lib/episode-checker/processor.ts`.
    *   [x] Define a result type, e.g., `ProcessingResult { status: 'timed_out' | 'completed' | 'processed' | 'failed' | 'no_change', error?: string, episodeId: string }`.
    *   [x] Create a core function `processSingleEpisode(episode: Episode, postProcessingService: PostProcessingService | null, postProcessingEnabled: boolean): Promise<ProcessingResult>`.
    *   [x] Move the logic from the existing `checkSpecificEpisode` and the loop inside `processAllEpisodes` (related to status checks, timeouts, DB updates, post-processing calls, revalidation) into `processSingleEpisode`.
    *   [x] Ensure necessary imports (`db`, `episodes`, `eq`, `revalidatePath`, constants, service type).
    *   [x] Corrected `Episode` type import using `InferSelectModel`.
    *   [x] Export the function and result type.

7.  **Refactor `route.ts`:**
    *   [x] Import types, constants, factory, finders, and processor from the new modules.
    *   [x] Remove the old local definitions (`EpisodeCheckResults`, constants, `getPostProcessingService`, `checkSpecificEpisode`, `processAllEpisodes`).
    *   [x] Update the `GET` handler:
        *   [x] Perform authorization.
        *   [x] Check for `episodeId` query parameter.
        *   [x] Get `postProcessingService` instance using the factory.
        *   [x] **If `episodeId`:**
            *   [x] Call `findEpisodeById`.
            *   [x] If episode found, call `processSingleEpisode`.
            *   [x] Format and return the single result.
            *   [x] Handle "not found" case.
        *   [x] **Else (batch mode):**
            *   [x] Call `findAllEpisodesToCheck`.
            *   [x] Initialize aggregated results (`EpisodeCheckResults`).
            *   [x] Loop through found episodes:
                *   [x] Call `processSingleEpisode` for each.
                *   [x] Update aggregated results based on the outcome of `processSingleEpisode`.
            *   [x] Format and return the aggregated results.
        *   [x] Handle top-level errors.
    *   [x] Ensure all unused imports are removed (db, eq, or, etc.).
    *   [x] Verify file length (should be significantly reduced).

8.  **Testing:**
    *   [ ] Test the endpoint with and without an `episodeId` query parameter.
    *   [ ] Verify status updates in the database.
    *   [ ] Check logs for correct execution and error handling. 