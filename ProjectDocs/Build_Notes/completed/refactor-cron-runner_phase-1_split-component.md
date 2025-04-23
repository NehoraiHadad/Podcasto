# Build Notes: Refactor CronRunner Component

**Build Title:** Refactor CronRunner
**Phase:** 1
**Task Group:** Split Component

## Task Objective

Refactor the `Podcasto/src/components/admin/cron-runner.tsx` component to improve readability, maintainability, and adherence to DRY principles by extracting constants, types, and result rendering logic into separate modules/components.

## Current State Assessment

The `cron-runner.tsx` component manages state, handles the selection and execution of different cron jobs (episode checker, podcast scheduler, full cron), and contains a large, multi-conditional function (`renderResultDetails`) to display the specific results for each job type. This leads to a long file (~370 lines) with mixed concerns.

## Future State Goal

The `CronRunner` component will be streamlined, focusing on state management, job selection/triggering, and overall layout. Constants and types will reside in a dedicated file. The complex result rendering logic will be delegated to separate, job-specific React components, promoting modularity and making the code easier to manage and test.

## Implementation Plan

1.  **Create `cron-runner-constants.ts`:**
    *   [x] Create `Podcasto/src/components/admin/cron-runner-constants.ts`.
    *   [x] Move `CronResult`, `CronJobType`, `CronJobOption`, `CronJobResult` interfaces/types to this file.
    *   [x] Move the `cronJobOptions` array definition to this file.
    *   [x] Export all types, interfaces, and the options array.
    *   [x] Update `cron-runner.tsx` to import these from the new file.

2.  **Create Result Detail Components:**
    *   [x] Create `Podcasto/src/components/admin/episode-checker-result-details.tsx`.
        *   [x] Define props interface (e.g., `EpisodeCheckerResultDetailsProps { results: EpisodeCheckerDetailedResult, timestamp: ... }`).
        *   [x] Move the rendering logic for 'episode-checker' from `renderResultDetails` into this component.
        *   [x] Import necessary types/constants (`CronResult`, `Badge`, etc.).
        *   [x] Export the component.
    *   [x] Create `Podcasto/src/components/admin/podcast-scheduler-result-details.tsx`.
        *   [x] Define props interface (e.g., `PodcastSchedulerResultDetailsProps { results: PodcastSchedulerDetailedResult, timestamp: ... }`).
        *   [x] Move the rendering logic for 'podcast-scheduler' from `renderResultDetails` into this component.
        *   [x] Import necessary types/components (`Badge`, `CheckCircle`, `AlertCircle`, etc.).
        *   [x] Consider creating a sub-component for rendering individual podcast results row.
        *   [x] Export the component.
    *   [x] Create `Podcasto/src/components/admin/full-cron-result-details.tsx`.
        *   [x] Define props interface (e.g., `FullCronResultDetailsProps { results: FullCronDetailedResult, timestamp: ... }`).
        *   [x] Move the rendering logic for 'full-cron' from `renderResultDetails` into this component.
        *   [x] Import necessary types/components (`CronJobResult`, `Badge`, `Accordion`, etc.).
        *   [x] Consider creating a sub-component for rendering individual job result rows with the accordion.
        *   [x] Export the component.

3.  **Refactor `cron-runner.tsx`:**
    *   [x] Import the new constants/types file.
    *   [x] Import the new result detail components.
    *   [x] Remove the definitions moved to `cron-runner-constants.ts`.
    *   [x] Remove the `renderResultDetails` function entirely.
    *   [x] Simplify `handleRunCron` (optional: extract action mapping logic if desired, but current switch is clear).
    *   [x] In the JSX, within the `CardContent` where results are displayed:
        *   [x] Conditionally render `<EpisodeCheckerResultDetails ... />`.
        *   [x] Conditionally render `<PodcastSchedulerResultDetails ... />`.
        *   [x] Conditionally render `<FullCronResultDetails ... />`.
        *   [x] Add more robust type checking and variable preparation before rendering detail components.
    *   [x] Ensure all necessary imports (React, components, actions, etc.) remain and remove unused ones.
    *   [x] Verify component length is significantly reduced.

4.  **Testing:**
    *   [ ] Run each cron job type from the UI.
    *   [ ] Verify the results are displayed correctly by the corresponding new component.
    *   [ ] Check for console errors. 