### Task Objective
Enable multi-select of episodes in the admin interface to perform bulk actions, starting with bulk delete.

### Current State Assessment
- `ServerEpisodesList` renders the episodes table as a Server Component with a per-row `EpisodeActionsMenu` for single-item actions.
- Deletion is supported per episode via server action `deleteEpisode` in `lib/actions/episode/core-actions.ts` (exported through `lib/actions/episode-actions.ts`).
- No bulk selection state/UI or bulk server action exists.

### Future State Goal
- Admin can select multiple episodes via checkboxes and execute "Delete Selected" with confirmation.
- Robust server action performs best-effort deletion across DB and S3, returns granular results, and the UI surfaces success/failure counts.

### Implementation Plan
1) Backend: Bulk Delete Server Action
   - [x] Create `podcasto/src/lib/actions/episode/bulk-delete.ts` exporting `deleteEpisodesBulk({ episodeIds }: { episodeIds: string[] })` → `{ success: boolean; deleted: string[]; failed: { id: string; error: string }[] }`.
     - [x] Validate input (non-empty, UUID format) and auth/role (admin-only) using existing auth utilities.
     - [x] For v1: iterate `episodeIds` and call existing `deleteEpisode(episodeId)` from `lib/actions/episode/core-actions` to reuse DB + S3 deletion.
     - [x] Aggregate per-id results; never stop on first error.
   - [x] Wire export in `podcasto/src/lib/actions/episode-actions.ts` (named export `deleteEpisodesBulk`).
   - [ ] Optional optimization (phase-2):
     - [ ] Add `deleteManyByIds` in `lib/db/utils.ts` and `episodesApi.deleteEpisodes(ids: string[])` for single-transaction DB delete.
     - [ ] Add batch S3 deletion helper if needed; otherwise keep per-episode S3 cleanup for clarity.

2) Frontend: Table Refactor for Selection
   - [x] Keep data fetching on the server: adapt `ServerEpisodesList` to fetch episodes and pass them as props to a new client component.
   - [x] Add `podcasto/src/components/admin/client-episodes-table.tsx` (Client Component):
       - [x] Render the table (can reuse existing shadcn `Table` components) with a new leading checkbox column.
       - [x] Header checkbox for select-all (current page) and per-row checkboxes.
       - [x] Local state (or small Zustand store) for `selectedEpisodeIds`.
       - [x] Keep file under 150 lines; extract UI fragments if necessary.
   - [x] Add `podcasto/src/components/admin/episodes-bulk-actions-bar.tsx` (Client Component):
       - [x] Sticky/inline bar visible only when `selectedEpisodeIds.length > 0`.
       - [x] Shows "n selected", button: "Delete Selected".
       - [x] On click → open `AlertDialog` confirmation; on confirm → call `deleteEpisodesBulk` and then `router.refresh()`.
       - [x] Use `sonner` toasts to report summary: total, deleted, failed count; show first few error messages if applicable.
   - [x] Add `podcasto/src/components/admin/episodes-table-wrapper.tsx` for state management.
   - [x] Update `ServerEpisodesList` to import and render `EpisodesTableWrapper` with necessary props.

3) UX & Behavior
   - [x] Selection scope: current rendered list (no cross-page persistence for now).
   - [x] Reset selection after any refresh or after successful bulk action.
   - [x] Disable action buttons while request is in-flight; show loading state text.
   - [x] Accessibility: labels for checkboxes and buttons; keyboard focus management for dialog.

4) Edge Cases & Rules
   - [x] Allow deletion regardless of status for now; consider blocking `processing` in a follow-up if needed.
   - [x] Handle partial failures gracefully; never leave UI stuck.
   - [x] Large selections (hundreds): warn that it may take time; server action still iterates safely.

5) Testing & Verification
   - [ ] Manual: select few, delete; select many, delete; include a failing id; verify toasts and list refresh.
   - [ ] Unit (optional if infra exists): test `deleteEpisodesBulk` happy-path and partial-failure aggregation.

6) Documentation
   - [ ] Update `podcasto/src/components/admin/README.md` with a short section on bulk actions and architecture (server fetch + client selection).

### Implementation Summary
**Completed:** 
- Created bulk delete server action with validation, best-effort iteration, and detailed result aggregation
- Refactored episodes table to support multi-select with checkboxes and indeterminate state
- Added sticky bulk actions bar with confirmation dialog and loading states  
- Preserved server-side data fetching while adding client-side selection state
- Comprehensive error handling and user feedback via toasts

**Files Created/Modified:**
- `podcasto/src/lib/actions/episode/bulk-delete.ts` (new)
- `podcasto/src/lib/actions/episode-actions.ts` (modified - added export)
- `podcasto/src/components/admin/client-episodes-table.tsx` (new)
- `podcasto/src/components/admin/episodes-bulk-actions-bar.tsx` (new)  
- `podcasto/src/components/admin/episodes-table-wrapper.tsx` (new)
- `podcasto/src/components/admin/server-episodes-list.tsx` (refactored)

### Notes / Future Phases
- Phase-2: DB `deleteManyByIds`, S3 batch deletion, pagination-aware selection, additional bulk actions (e.g., publish/unpublish).

