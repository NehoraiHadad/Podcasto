# Admin Features - Comprehensive Analysis & Refactoring Plan

**Task Group:** 6.1 - 6.7
**Phase:** 3 (UI Layer)
**Created:** 2025-10-15
**Status:** Planning

---

## Executive Summary

This document provides a comprehensive analysis of the Admin Features domain and proposes a **re-prioritized implementation plan** based on actual code analysis. Unlike the initial planning in `06_admin_features.md`, this analysis identifies which components actually need refactoring versus those that are already well-structured.

### Key Findings

1. ✅ **Admin Layout (Task 6.1) is already excellent** - No refactoring needed
2. ⚠️ **Action Menus (Task 6.6) need immediate attention** - 541 lines with duplicate patterns
3. ⚠️ **Table Component (Task 6.3) has mixed responsibilities** - 220 lines to refactor
4. ⚠️ **Cron Runner (Task 6.7) could be improved** - Extract hook pattern
5. ℹ️ **Podcast Form (Task 6.2) looks well-structured** - Need to verify sub-components
6. ℹ️ **Dashboard (Task 6.5) and Bulk Operations (Task 6.4)** - Lower priority

### Recommended Implementation Order

1. **Task 6.6**: Action Menus Pattern (HIGHEST PRIORITY)
2. **Task 6.3**: Shared Table Components
3. **Task 6.7**: Cron Management UI
4. **Task 6.2**: Podcast Form (verify sub-components)
5. **Task 6.5**: Admin Dashboard Redesign
6. **Task 6.4**: Bulk Operations Service
7. **Task 6.1**: Admin Layout (SKIP - already excellent)

---

## Current State Analysis

### File Statistics

| Component | File | Lines | Status |
|-----------|------|-------|--------|
| Admin Layout | `src/app/admin/layout.tsx` | 28 | ✅ Excellent |
| Podcast Actions | `src/components/admin/podcast-actions-menu.tsx` | 270 | ⚠️ Needs Refactoring |
| Episode Actions | `src/components/admin/episode-actions-menu.tsx` | 271 | ⚠️ Needs Refactoring |
| Episodes Table | `src/components/admin/client-episodes-table.tsx` | 220 | ⚠️ Needs Refactoring |
| Cron Runner | `src/components/admin/cron-runner.tsx` | 200 | ⚠️ Could Improve |
| Podcast Form | `src/components/admin/podcast-form/podcast-form-tabs.tsx` | 215 | ℹ️ Looks Good |

**Total Lines to Refactor:** ~961 lines (excluding admin layout)

---

## Detailed Component Analysis

### 1. Admin Layout (Task 6.1) ✅ Already Excellent

**File:** `src/app/admin/layout.tsx` (28 lines)

**Current Structure:**
```tsx
import { verifyAdminAccess } from '@/lib/utils/admin-utils';
import { AdminSidebar } from '@/components/admin/admin-sidebar';
import { AdminErrorBoundary } from '@/components/admin/error-boundary';
import { SidebarContentWrapper } from '@/components/admin/admin-sidebar/content-wrapper';
import { SidebarProvider } from '@/components/admin/admin-sidebar';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await verifyAdminAccess();

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-gray-50">
        <AdminSidebar />
        <SidebarContentWrapper>
          <AdminErrorBoundary>
            <main className="p-4 md:p-6">{children}</main>
          </AdminErrorBoundary>
        </SidebarContentWrapper>
      </div>
    </SidebarProvider>
  );
}
```

**Why It's Excellent:**
- ✅ Clean, minimal code (28 lines)
- ✅ Proper security with `verifyAdminAccess()`
- ✅ Organized component hierarchy
- ✅ Has error boundary
- ✅ Responsive design (p-4 md:p-6)
- ✅ Proper provider pattern
- ✅ Server component (async)

**Recommendation:** **SKIP THIS TASK** - No refactoring needed. Move to other priorities.

---

### 2. Action Menus (Task 6.6) ⚠️ HIGHEST PRIORITY

#### 2.1 Podcast Actions Menu

**File:** `src/components/admin/podcast-actions-menu.tsx` (270 lines)

**Current Problems:**
1. **7 state variables** - mixed UI state management
2. **Multiple handlers** - handleDelete, handleTogglePause, handleStatusChange
3. **Complex dropdown** - 8+ action items with conditional rendering
4. **AlertDialog embedded** - delete confirmation mixed with actions
5. **Duplicate pattern** with episode-actions-menu

**Current Structure:**
```tsx
'use client';

export function PodcastActionsMenu({ podcast, onUpdate }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPausingToggling, setIsPausingToggling] = useState(false);
  const [isStatusChanging, setIsStatusChanging] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [feedbackType, setFeedbackType] = useState<'success' | 'error'>('success');

  const handleDelete = async () => { /* ... */ };
  const handleTogglePause = async () => { /* ... */ };
  const handleStatusChange = async (newStatus: string) => { /* ... */ };

  return (
    <>
      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
        {/* 8+ dropdown items */}
      </DropdownMenu>
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        {/* Delete confirmation */}
      </AlertDialog>
    </>
  );
}
```

**Key Issues:**
- Lines 15-60: State management (7 variables)
- Lines 62-140: Handler functions (80 lines)
- Lines 142-270: JSX rendering (130 lines)
- Mixed responsibilities: UI + API calls + state + dialogs

#### 2.2 Episode Actions Menu

**File:** `src/components/admin/episode-actions-menu.tsx` (271 lines)

**Similar Problems:**
- Similar state management pattern
- Similar handler pattern
- Similar dropdown structure
- AlertDialog with checkbox for S3 deletion warning

**Total Impact:** 541 lines with ~70% duplicate patterns

---

### 3. Episodes Table (Task 6.3) ⚠️ High Priority

**File:** `src/components/admin/client-episodes-table.tsx` (220 lines)

**Current Problems:**
1. **Helper functions inline** - formatDuration, getErrorMessage, renderStatus
2. **Complex selection logic** - handleEpisodeSelect, handleSelectAll, indeterminate state
3. **Status rendering logic** - switch statement with badge variants
4. **Mixed responsibilities** - formatting + selection + rendering

**Current Structure:**
```tsx
'use client';

export function ClientEpisodesTable({ episodes, selectedEpisodeIds, onSelectionChange }: Props) {
  // Lines 52-57: formatDuration helper
  const formatDuration = (durationInSeconds: number | null): string => { /* ... */ };

  // Lines 60-68: getErrorMessage helper
  const getErrorMessage = (metadata: string | null): string | null => { /* ... */ };

  // Lines 71-103: renderStatus helper with switch statement
  const renderStatus = (status: string | null, metadata: string | null) => { /* ... */ };

  // Lines 106-121: Selection handlers
  const handleEpisodeSelect = (episodeId: string, checked: boolean) => { /* ... */ };
  const handleSelectAll = (checked: boolean) => { /* ... */ };

  // Lines 126-220: Table rendering (95 lines)
  return (<Table>...</Table>);
}
```

**Key Issues:**
- Lines 52-103: Helper functions (52 lines) - should be utilities
- Lines 106-121: Selection logic (16 lines) - should be a hook
- Lines 126-220: Table JSX (95 lines) - too long
- No reusability - podcast table would duplicate this

---

### 4. Cron Runner (Task 6.7) ⚠️ Medium Priority

**File:** `src/components/admin/cron-runner.tsx` (200 lines)

**Current Problems:**
1. **Job selection logic** in component
2. **Result type guards** - complex conditional logic (lines 87-111)
3. **Switch statement** for job execution
4. **Could extract hook** - use-cron-runner

**Current Structure:**
```tsx
'use client';

export function CronRunner() {
  const [isRunning, setIsRunning] = useState(false);
  const [lastRunTime, setLastRunTime] = useState<Date | null>(null);
  const [lastResult, setLastResult] = useState<CronOperationResult | null>(null);
  const [selectedJob, setSelectedJob] = useState<CronJobType>('episode-checker');

  const handleRunCron = async () => {
    // Lines 34-77: Switch statement + API calls
    switch (selectedJob) {
      case 'episode-checker': result = await runEpisodeChecker(); break;
      case 'podcast-scheduler': result = await runPodcastScheduler(); break;
      case 'google-audio-generator': result = await runGoogleAudioGenerator(); break;
      case 'full-cron': result = await runAllCronJobs(); break;
    }
  };

  // Lines 82-111: Type guards for result details (30 lines)
  let episodeCheckerDetails: { results: ..., timestamp: ... } | null = null;
  // Complex conditional logic

  return (<Card>...</Card>);
}
```

**Not Critical But Could Improve:**
- Extract hook: `use-cron-runner.ts` with job execution logic
- Simplify type guards
- Extract result rendering components
- File is ~200 lines but not terrible

---

### 5. Podcast Form (Task 6.2) ℹ️ Looks Well-Structured

**File:** `src/components/admin/podcast-form/podcast-form-tabs.tsx` (215 lines)

**Current Structure:**
```tsx
export function PodcastFormTabs<T>({ form, mode, incompleteTabsMessage, podcastId }: Props) {
  const [activeTab, setActiveTab] = useState<string>(TAB_VALUES.BASIC_INFO);

  const tabs = useMemo(() => [...], []);
  const currentTabIndex = tabs.findIndex(tab => tab.value === activeTab);

  const goToNextTab = useCallback(...);
  const goToPreviousTab = useCallback(...);
  const handleTabChange = useCallback(...);
  const setTabByIndex = useCallback(...);

  return (
    <Tabs>
      {/* Desktop tabs */}
      {/* Mobile navigation */}
      {/* Tab content for each section */}
    </Tabs>
  );
}
```

**Why It Looks Good:**
- ✅ Uses `useCallback` and `useMemo` properly
- ✅ Responsive design (mobile/desktop)
- ✅ Clean tab constants
- ✅ Sub-components for each tab section
- ✅ Navigation logic is clear

**Potential Issues:**
- Need to check sub-components:
  - `BasicInfoFields`
  - `ContentSourceFields`
  - `BasicSettingsFields`
  - `AdvancedSettingsFields`
  - `StyleRolesFields`
- These might need refactoring if they're large

**Recommendation:** Low priority - verify sub-components first

---

### 6. Admin Dashboard (Task 6.5) ℹ️ Page Improvements

**Status:** Not analyzed yet (page file)

**Planned Improvements:**
- Statistics cards
- Quick actions
- Recent activity
- Visual improvements

**Recommendation:** Medium-low priority after action menus and table

---

### 7. Bulk Operations Service (Task 6.4) ℹ️ Backend Service

**Status:** Backend service layer

**Purpose:**
- Centralize bulk operations logic
- Used by action menus and tables

**Recommendation:** Implement after action menus refactor (Task 6.6)

---

## Refactoring Plans by Priority

### PRIORITY 1: Task 6.6 - Action Menus Pattern

**Goal:** Extract common action menu pattern from 541 lines (270 + 271)

**Target Files:**
1. `src/components/admin/podcast-actions-menu.tsx` (270 lines)
2. `src/components/admin/episode-actions-menu.tsx` (271 lines)

**Refactoring Strategy:**

#### Phase 1: Extract Custom Hook - `use-action-menu.ts`

Create hook to manage action menu state and handlers:

```tsx
// src/components/admin/action-menus/hooks/use-action-menu.ts

'use client';

interface UseActionMenuOptions<T> {
  item: T;
  onUpdate?: () => void;
  actions: {
    delete?: (id: string) => Promise<{ success: boolean; error?: string }>;
    toggleStatus?: (id: string, newStatus: string) => Promise<{ success: boolean; error?: string }>;
    // ... other actions
  };
}

export function useActionMenu<T>({ item, onUpdate, actions }: UseActionMenuOptions<T>) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async () => {
    if (!actions.delete) return;
    setIsLoading(true);
    const result = await actions.delete(item.id);
    setIsLoading(false);
    if (result.success) {
      setDeleteDialogOpen(false);
      onUpdate?.();
      toast.success('Deleted successfully');
    } else {
      toast.error(result.error || 'Failed to delete');
    }
  };

  // ... other handlers

  return {
    menuOpen,
    setMenuOpen,
    deleteDialogOpen,
    setDeleteDialogOpen,
    isLoading,
    handleDelete,
    // ... other handlers
  };
}
```

#### Phase 2: Extract Shared Components

1. **delete-confirmation-dialog.tsx** - Reusable delete confirmation
2. **action-dropdown-item.tsx** - Standardized dropdown item
3. **action-menu-wrapper.tsx** - Common menu structure

#### Phase 3: Create Specific Action Menus

1. **podcast-actions-menu.tsx** (target: <100 lines)
   - Uses `useActionMenu` hook
   - Uses shared components
   - Defines podcast-specific actions only

2. **episode-actions-menu.tsx** (target: <100 lines)
   - Uses `useActionMenu` hook
   - Uses shared components
   - Defines episode-specific actions only

#### Phase 4: Delete Old Files

- ✅ Delete `src/components/admin/podcast-actions-menu.tsx` (270 lines)
- ✅ Delete `src/components/admin/episode-actions-menu.tsx` (271 lines)

**Expected Outcome:**
- From: 541 lines → To: ~350 lines (6 new files)
- 35% code reduction
- Reusable pattern for future action menus
- Build passing

---

### PRIORITY 2: Task 6.3 - Shared Table Components

**Goal:** Extract reusable table logic from 220 lines

**Target File:**
- `src/components/admin/client-episodes-table.tsx` (220 lines)

**Refactoring Strategy:**

#### Phase 1: Extract Utilities

Create `src/lib/utils/table-utils.ts`:

```tsx
export function formatDuration(durationInSeconds: number | null): string {
  if (!durationInSeconds) return 'Unknown';
  const minutes = Math.floor(durationInSeconds / 60);
  const seconds = durationInSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function getErrorMessage(metadata: string | null): string | null {
  if (!metadata) return null;
  try {
    const meta = JSON.parse(metadata);
    return meta.error || null;
  } catch {
    return null;
  }
}
```

#### Phase 2: Extract Custom Hook - `use-table-selection.ts`

```tsx
// src/components/admin/shared/hooks/use-table-selection.ts

'use client';

interface UseTableSelectionOptions<T> {
  items: T[];
  getItemId: (item: T) => string;
  initialSelectedIds?: string[];
  onSelectionChange?: (selectedIds: string[]) => void;
}

export function useTableSelection<T>({
  items,
  getItemId,
  initialSelectedIds = [],
  onSelectionChange
}: UseTableSelectionOptions<T>) {
  const [selectedIds, setSelectedIds] = useState<string[]>(initialSelectedIds);

  const handleItemSelect = (itemId: string, checked: boolean) => {
    const newSelectedIds = checked
      ? [...selectedIds, itemId]
      : selectedIds.filter(id => id !== itemId);
    setSelectedIds(newSelectedIds);
    onSelectionChange?.(newSelectedIds);
  };

  const handleSelectAll = (checked: boolean) => {
    const newSelectedIds = checked ? items.map(getItemId) : [];
    setSelectedIds(newSelectedIds);
    onSelectionChange?.(newSelectedIds);
  };

  const isAllSelected = items.length > 0 && selectedIds.length === items.length;
  const isIndeterminate = selectedIds.length > 0 && selectedIds.length < items.length;

  return {
    selectedIds,
    handleItemSelect,
    handleSelectAll,
    isAllSelected,
    isIndeterminate
  };
}
```

#### Phase 3: Extract Status Rendering Component

```tsx
// src/components/admin/shared/status-cell.tsx

interface StatusCellProps {
  status: string | null;
  metadata?: string | null;
}

export function StatusCell({ status, metadata }: StatusCellProps) {
  if (!status) return <Badge variant="outline">Unknown</Badge>;

  if (status.toLowerCase() === 'failed') {
    const errorMsg = getErrorMessage(metadata || null);
    return (
      <div className="flex items-center gap-1">
        <Badge variant="destructive">Failed</Badge>
        {errorMsg && (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="ml-1 cursor-pointer text-red-500">
                <AlertCircle size={16} />
              </span>
            </TooltipTrigger>
            <TooltipContent sideOffset={4}>
              <span className="max-w-xs break-words whitespace-pre-line">{errorMsg}</span>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    );
  }

  // ... other status cases
}
```

#### Phase 4: Refactor Main Table Component

```tsx
// src/components/admin/episodes/episodes-table.tsx (target: <100 lines)

'use client';

export function EpisodesTable({ episodes, selectedEpisodeIds, onSelectionChange }: Props) {
  const { selectedIds, handleItemSelect, handleSelectAll, isAllSelected, isIndeterminate } =
    useTableSelection({
      items: episodes,
      getItemId: (episode) => episode.id,
      initialSelectedIds: selectedEpisodeIds,
      onSelectionChange
    });

  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <SelectAllCheckbox
                checked={isAllSelected}
                indeterminate={isIndeterminate}
                onCheckedChange={handleSelectAll}
              />
            </TableHead>
            {/* ... other headers */}
          </TableRow>
        </TableHeader>
        <TableBody>
          {episodes.map((episode) => (
            <TableRow key={episode.id}>
              <TableCell>
                <Checkbox
                  checked={selectedIds.includes(episode.id)}
                  onCheckedChange={(checked) => handleItemSelect(episode.id, !!checked)}
                />
              </TableCell>
              {/* ... other cells */}
              <TableCell>
                <StatusCell status={episode.status} metadata={episode.metadata} />
              </TableCell>
              <TableCell>
                {formatDuration(episode.duration)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
```

#### Phase 5: Create Shared Table Structure (Optional - Future)

If we need multiple tables, create generic `DataTable` component:

```tsx
// src/components/admin/shared/data-table.tsx

interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  selectable?: boolean;
  onSelectionChange?: (selectedIds: string[]) => void;
}

export function DataTable<T>({ data, columns, selectable, onSelectionChange }: DataTableProps<T>) {
  // Generic table with column definitions
  // Similar to shadcn/ui data-table pattern
}
```

#### Phase 6: Delete Old File

- ✅ Delete `src/components/admin/client-episodes-table.tsx` (220 lines)

**Expected Outcome:**
- From: 220 lines → To: ~280 lines (8 new files)
- Better organization with utilities, hooks, components
- Reusable selection logic for future tables
- Build passing

---

### PRIORITY 3: Task 6.7 - Cron Management UI

**Goal:** Extract hook from 200-line component

**Target File:**
- `src/components/admin/cron-runner.tsx` (200 lines)

**Refactoring Strategy:**

#### Phase 1: Extract Custom Hook - `use-cron-runner.ts`

```tsx
// src/components/admin/cron-runner/hooks/use-cron-runner.ts

'use client';

interface UseCronRunnerOptions {
  initialJob?: CronJobType;
}

export function useCronRunner({ initialJob = 'episode-checker' }: UseCronRunnerOptions = {}) {
  const [isRunning, setIsRunning] = useState(false);
  const [lastRunTime, setLastRunTime] = useState<Date | null>(null);
  const [lastResult, setLastResult] = useState<CronOperationResult | null>(null);
  const [selectedJob, setSelectedJob] = useState<CronJobType>(initialJob);

  const runJob = async () => {
    setIsRunning(true);
    setLastResult(null);
    setLastRunTime(null);

    try {
      let result: CronOperationResult;
      const jobLabel = getJobLabel(selectedJob);
      toast.info(`Running ${jobLabel}...`);

      switch (selectedJob) {
        case 'episode-checker':
          result = await runEpisodeChecker();
          break;
        case 'podcast-scheduler':
          result = await runPodcastScheduler();
          break;
        case 'google-audio-generator':
          result = await runGoogleAudioGenerator();
          break;
        case 'full-cron':
          result = await runAllCronJobs();
          break;
        default:
          result = { success: false, message: 'Invalid job type' };
      }

      setLastRunTime(new Date());
      setLastResult(result);

      if (result.success) {
        toast.success(`${jobLabel} completed successfully.`);
      } else {
        toast.error(`${jobLabel} failed: ${result.message || 'Unknown error'}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error running CRON job:', error);
      toast.error(`Failed to run: ${errorMessage}`);
      setLastResult({ success: false, message: errorMessage });
    } finally {
      setIsRunning(false);
    }
  };

  return {
    isRunning,
    lastRunTime,
    lastResult,
    selectedJob,
    setSelectedJob,
    runJob
  };
}
```

#### Phase 2: Extract Result Type Utilities

```tsx
// src/components/admin/cron-runner/utils/result-type-guards.ts

export function parseEpisodeCheckerResult(lastResult: CronOperationResult) {
  if (!lastResult?.details || typeof lastResult.details !== 'object') return null;
  if (!('results' in lastResult.details) || !lastResult.details.results) return null;

  return {
    results: lastResult.details.results as EpisodeCheckerDetailedResult,
    timestamp: lastResult.details.timestamp as string | Date | null
  };
}

export function parsePodcastSchedulerResult(lastResult: CronOperationResult) {
  // Similar pattern
}

// ... other parsers
```

#### Phase 3: Extract Result Components (Already Exists)

- `episode-checker-result-details.tsx`
- `podcast-scheduler-result-details.tsx`
- `google-audio-generator-result-details.tsx`
- `full-cron-result-details.tsx`

#### Phase 4: Refactor Main Component

```tsx
// src/components/admin/cron-runner.tsx (target: <100 lines)

'use client';

export function CronRunner() {
  const { isRunning, lastRunTime, lastResult, selectedJob, setSelectedJob, runJob } =
    useCronRunner();

  const selectedJobOption = CRON_JOB_OPTIONS.find(job => job.value === selectedJob);

  // Parse results using type guard utilities
  const episodeCheckerDetails = selectedJob === 'episode-checker'
    ? parseEpisodeCheckerResult(lastResult)
    : null;
  const podcastSchedulerDetails = selectedJob === 'podcast-scheduler'
    ? parsePodcastSchedulerResult(lastResult)
    : null;
  // ... other parsers

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manual CRON Runner</CardTitle>
        <CardDescription>
          Select and run scheduled tasks manually. Current:
          <span className="font-semibold">{selectedJobOption?.label}</span>
        </CardDescription>
        <JobSelector selectedJob={selectedJob} onJobChange={setSelectedJob} disabled={isRunning} />
      </CardHeader>

      <CardContent className="space-y-4">
        <Button onClick={runJob} disabled={isRunning} className="w-full sm:w-auto">
          {isRunning ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : selectedJobOption?.icon}
          {isRunning ? 'Running...' : `Run ${selectedJobOption?.label || 'Job'}`}
        </Button>

        {lastResult && (
          <ResultAlert result={lastResult}>
            {episodeCheckerDetails && <EpisodeCheckerResultDetails {...episodeCheckerDetails} />}
            {podcastSchedulerDetails && <PodcastSchedulerResultDetails {...podcastSchedulerDetails} />}
            {/* ... other result details */}
          </ResultAlert>
        )}
      </CardContent>

      {lastRunTime && <LastRunFooter time={lastRunTime} />}
    </Card>
  );
}
```

#### Phase 5: Create Additional Components

1. **job-selector.tsx** - Job selection dropdown
2. **result-alert.tsx** - Alert wrapper
3. **last-run-footer.tsx** - Footer with timestamp

#### Phase 6: Delete Old File

- ✅ Delete `src/components/admin/cron-runner.tsx` (200 lines)

**Expected Outcome:**
- From: 200 lines → To: ~250 lines (7 new files)
- Cleaner hook separation
- More testable logic
- Build passing

---

## Lower Priority Tasks

### Task 6.2: Podcast Form

**Status:** Looks well-structured, verify sub-components

**Action Plan:**
1. Read sub-component files:
   - `BasicInfoFields`
   - `ContentSourceFields`
   - `BasicSettingsFields`
   - `AdvancedSettingsFields`
   - `StyleRolesFields`
2. Check if any are > 150 lines
3. Refactor only if needed

### Task 6.5: Admin Dashboard Redesign

**Status:** Page improvements

**Action Plan:**
1. Analyze current dashboard page
2. Add statistics cards
3. Add quick actions
4. Add recent activity feed
5. Visual improvements

### Task 6.4: Bulk Operations Service

**Status:** Backend service layer

**Action Plan:**
1. Create `src/lib/services/bulk-operations.ts`
2. Centralize bulk delete/update logic
3. Use in action menus and tables

### Task 6.1: Admin Layout

**Status:** ✅ Already excellent, SKIP

**Recommendation:** No action needed. Layout is clean, organized, and follows Next.js 15 best practices.

---

## Implementation Timeline

### Phase 1: High Priority (3 tasks)
1. **Task 6.6** - Action Menus Pattern (~2-3 hours)
2. **Task 6.3** - Shared Table Components (~2-3 hours)
3. **Task 6.7** - Cron Management UI (~1-2 hours)

**Total Phase 1:** ~5-8 hours, ~900 lines refactored

### Phase 2: Medium Priority (3 tasks)
4. **Task 6.2** - Podcast Form (verify + refactor if needed)
5. **Task 6.5** - Admin Dashboard Redesign
6. **Task 6.4** - Bulk Operations Service

**Total Phase 2:** ~4-6 hours

### Phase 3: Completion
7. **Task 6.1** - Admin Layout (SKIP)

**Total Project:** ~9-14 hours for Admin Features domain

---

## Success Metrics

### Code Quality
- All files < 150 lines (target: < 100 lines for main components)
- Proper hook extraction ('use client' only where needed)
- Reusable patterns across admin domain
- No duplicate code between action menus

### Build Verification
- `npm run build` passes
- No TypeScript errors
- No ESLint errors (beyond pre-existing)

### Code Reduction
- Action menus: 541 → ~350 lines (-35%)
- Episodes table: 220 → ~100 lines (-55%)
- Cron runner: 200 → ~100 lines (-50%)
- **Total reduction: ~961 → ~550 lines (-43%)**

### Documentation
- All tasks documented in planning
- Commits for each completed task
- Update `06_admin_features.md` with completion status

---

## Next Steps

1. ✅ Complete this planning document
2. ✅ Commit planning document
3. 🔄 Start with **Task 6.6** (Action Menus Pattern)
4. Launch `senior-frontend-dev` subagent with detailed requirements
5. Follow successful pattern from Tasks 5.8, 5.9, 5.10

---

## Appendix: Pattern References

### Custom Hook Pattern
Reference: `use-bulk-generation.ts`, `use-status-polling.ts` (Task 5.8, 5.9)

### Shared Component Pattern
Reference: Loading/Error states (Task 5.10)

### Component Composition
Reference: Bulk Episode Generator steps (Task 5.8)

### Delete Old Code
**CRITICAL:** Always delete old files after creating new structure
- Task 5.8: ✅ Deleted `bulk-episode-generator.tsx`
- Task 5.9: ✅ Deleted `podcast-status-indicator.tsx`
- Task 6.6: ✅ Must delete both action menu files
- Task 6.3: ✅ Must delete old table file
- Task 6.7: ✅ Must delete old cron-runner file

---

**Document Version:** 1.0
**Last Updated:** 2025-10-15
**Status:** Ready for implementation
