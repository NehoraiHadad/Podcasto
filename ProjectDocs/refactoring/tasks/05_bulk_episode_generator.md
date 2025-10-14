# Task 5.8: Refactor Bulk Episode Generator

## Task Objective
Break down the monolithic `bulk-episode-generator.tsx` (361 lines) into modular, maintainable components following the composition patterns established in previous tasks.

## Current State Analysis

### File: `src/components/admin/bulk-episode-generator.tsx`
- **Lines**: 361
- **Type**: Client Component ('use client')
- **Complexity**: High - Multi-step wizard with 4 distinct states
- **State Management**: 7 state variables in main component
- **Responsibilities**: Too many!
  - Date range selection UI
  - Preview data display
  - Generation progress UI
  - Completion results UI
  - Dialog management
  - Server action calls
  - Router navigation
  - Toast notifications

### Current Structure
```tsx
export function BulkEpisodeGenerator({ podcastId, podcastTitle, isPaused }) {
  // 7 state variables
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<GenerationStep>('selection');
  const [dateRange, setDateRange] = useState<...>(null);
  const [previewData, setPreviewData] = useState<...>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationResults, setGenerationResults] = useState<...>(null);

  // 5 event handlers (150+ lines)
  const handleDateRangeSelect = () => {...};
  const handleClearDateRange = () => {...};
  const handlePreview = async () => {...}; // Server action
  const handleGenerate = async () => {...}; // Server action
  const handleReset = () => {...};
  const handleClose = () => {...};

  // 211 lines of JSX with 4 conditional UI sections
  return (
    <Dialog>
      {/* Step 1: Selection UI (31 lines) */}
      {/* Step 2: Preview UI (58 lines) */}
      {/* Step 3: Generating UI (10 lines) */}
      {/* Step 4: Completed UI (48 lines) */}
      {/* Footer buttons (31 lines) */}
    </Dialog>
  );
}
```

### Problems

1. **Monolithic Structure**
   - All logic in single component
   - Hard to test individual steps
   - Difficult to maintain

2. **Complex State Management**
   - 7 interdependent state variables
   - State transitions scattered throughout handlers
   - No centralized state machine

3. **Mixed Responsibilities**
   - UI rendering + business logic
   - Dialog management + wizard flow
   - Server actions + client state

4. **Repetitive Code**
   - Similar button patterns in footer
   - Repeated Alert patterns
   - Common Badge/Card structures

---

## Future State Design

### Target Structure

```
src/components/admin/bulk-episode-generator/
├── index.ts                                 (exports)
├── types.ts                                 (TypeScript interfaces)
├── bulk-episode-generator.tsx               (main orchestrator, ~80 lines)
├── hooks/
│   └── use-bulk-generation.ts               (state machine + actions, ~100 lines)
├── steps/
│   ├── selection-step.tsx                   (~60 lines)
│   ├── preview-step.tsx                     (~80 lines)
│   ├── generating-step.tsx                  (~30 lines)
│   └── completed-step.tsx                   (~70 lines)
└── components/
    ├── generation-footer.tsx                (~50 lines)
    ├── episode-preview-list.tsx             (~40 lines)
    └── generation-stats.tsx                 (~40 lines)
```

### Design Patterns

#### 1. Custom Hook Pattern - State Machine
Extract all state management and server actions into a custom hook:

```tsx
// hooks/use-bulk-generation.ts
export function useBulkGeneration(podcastId: string) {
  const [step, setStep] = useState<GenerationStep>('selection');
  const [dateRange, setDateRange] = useState<DateRange | null>(null);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationResults, setGenerationResults] = useState<GenerationResults | null>(null);

  // Centralized actions
  const actions = {
    selectDateRange: (startDate: Date, endDate: Date) => {...},
    clearDateRange: () => {...},
    preview: async () => {...},
    generate: async () => {...},
    reset: () => {...},
    goToStep: (newStep: GenerationStep) => {...},
  };

  // Computed values
  const canPreview = dateRange !== null;
  const canGenerate = previewData && step === 'preview';

  return {
    step,
    dateRange,
    previewData,
    isGenerating,
    generationResults,
    actions,
    canPreview,
    canGenerate,
  };
}
```

#### 2. Step Components Pattern
Extract each step into its own component:

```tsx
// steps/selection-step.tsx
interface SelectionStepProps {
  isPaused: boolean;
  dateRange: DateRange | null;
  onDateRangeSelect: (startDate: Date, endDate: Date) => void;
  onClearDateRange: () => void;
}

export function SelectionStep({ isPaused, dateRange, onDateRangeSelect, onClearDateRange }: SelectionStepProps) {
  return (
    <div className="space-y-4">
      {isPaused && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            This podcast is paused. Episodes will be created but automatic scheduling is disabled.
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <label className="text-sm font-medium">Select Date Range</label>
        <EpisodeDateRangePicker
          onRangeSelect={onDateRangeSelect}
          onClear={onClearDateRange}
          defaultHours={24}
        />
      </div>

      {dateRange && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Selected: {dateRange.startDate.toLocaleDateString()} - {dateRange.endDate.toLocaleDateString()}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
```

```tsx
// steps/preview-step.tsx
interface PreviewStepProps {
  previewData: PreviewData;
}

export function PreviewStep({ previewData }: PreviewStepProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Episode Preview</CardTitle>
        <CardDescription>
          {previewData.totalEpisodes} episode{previewData.totalEpisodes !== 1 ? 's' : ''} will be created
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4 flex-wrap text-sm">
          <Badge variant="secondary">
            Estimated time: {previewData.estimatedTime}
          </Badge>
          {previewData.batchConfiguration?.requiresBatching && (
            <Badge variant="outline">
              {previewData.batchConfiguration.totalBatches} batch{previewData.batchConfiguration.totalBatches > 1 ? 'es' : ''} needed
            </Badge>
          )}
        </div>

        <BatchingAlert batchConfiguration={previewData.batchConfiguration} estimatedTime={previewData.estimatedTime} />

        <EpisodePreviewList episodes={previewData.episodeDates} />
      </CardContent>
    </Card>
  );
}
```

```tsx
// steps/generating-step.tsx
export function GeneratingStep() {
  return (
    <div className="flex flex-col items-center justify-center py-8 space-y-4">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <div className="text-center space-y-2">
        <p className="font-medium">Generating Episodes...</p>
        <p className="text-sm text-muted-foreground">
          This may take several minutes. Please wait.
        </p>
      </div>
    </div>
  );
}
```

```tsx
// steps/completed-step.tsx
interface CompletedStepProps {
  results: GenerationResults;
}

export function CompletedStep({ results }: CompletedStepProps) {
  const allSucceeded = results.failureCount === 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          {allSucceeded ? (
            <>
              <CheckCircle className="h-5 w-5 text-green-600" />
              Generation Completed Successfully
            </>
          ) : (
            <>
              <AlertCircle className="h-5 w-5 text-amber-600" />
              Generation Completed with Issues
            </>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <GenerationStats results={results} />

        {results.failureCount > 0 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Some episodes failed to generate. Check the episodes list for details.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
```

#### 3. Main Component - Orchestrator
Simplified main component that orchestrates the steps:

```tsx
// bulk-episode-generator.tsx
export function BulkEpisodeGenerator({ podcastId, podcastTitle, isPaused }: BulkEpisodeGeneratorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const {
    step,
    dateRange,
    previewData,
    isGenerating,
    generationResults,
    actions,
    canPreview,
    canGenerate,
  } = useBulkGeneration(podcastId);

  const handleClose = () => {
    setIsOpen(false);
    setTimeout(() => actions.reset(), 300);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <CalendarRange className="h-4 w-4" />
          Generate Multiple Episodes
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Episode Generator</DialogTitle>
          <DialogDescription>
            Create multiple episodes for &quot;{podcastTitle}&quot; based on frequency settings
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {(step === 'selection' || step === 'preview') && (
            <SelectionStep
              isPaused={isPaused}
              dateRange={dateRange}
              onDateRangeSelect={actions.selectDateRange}
              onClearDateRange={actions.clearDateRange}
            />
          )}

          {step === 'preview' && previewData && (
            <PreviewStep previewData={previewData} />
          )}

          {step === 'generating' && <GeneratingStep />}

          {step === 'completed' && generationResults && (
            <CompletedStep results={generationResults} />
          )}
        </div>

        <GenerationFooter
          step={step}
          canPreview={canPreview}
          canGenerate={canGenerate}
          isGenerating={isGenerating}
          onClose={handleClose}
          onPreview={actions.preview}
          onGenerate={actions.generate}
          onReset={actions.reset}
          onBack={() => actions.goToStep('selection')}
        />
      </DialogContent>
    </Dialog>
  );
}
```

---

## Implementation Plan

### Phase 1: Create Directory Structure & Types
1. Create directory: `src/components/admin/bulk-episode-generator/`
2. Create `types.ts` with all TypeScript interfaces:
   - `BulkEpisodeGeneratorProps`
   - `GenerationStep`
   - `DateRange`
   - `PreviewData`
   - `GenerationResults`
   - `BatchConfiguration`
3. Move type definitions from main file

### Phase 2: Extract Custom Hook
1. Create `hooks/use-bulk-generation.ts`
2. Move all state management
3. Move all event handlers
4. Move server action calls
5. Export centralized API

### Phase 3: Create Step Components
1. Create `steps/selection-step.tsx`
2. Create `steps/preview-step.tsx`
3. Create `steps/generating-step.tsx`
4. Create `steps/completed-step.tsx`
5. Each step receives props from hook

### Phase 4: Create Shared Components
1. Create `components/generation-footer.tsx` (dialog footer buttons)
2. Create `components/episode-preview-list.tsx` (list of episodes to create)
3. Create `components/generation-stats.tsx` (success/failure stats)

### Phase 5: Refactor Main Component
1. Update `bulk-episode-generator.tsx` to use hook
2. Replace inline JSX with step components
3. Use `GenerationFooter` component
4. Simplify to ~80 lines

### Phase 6: Create Index & Cleanup
1. Create `index.ts` with proper exports
2. Update import in parent component
3. Delete old monolithic file
4. Verify no unused code

---

## Expected Impact

### Code Metrics
- **Main Component**: 361 → ~80 lines (-78%, -281 lines)
- **New Files**: 10 files, ~550 total lines
- **Net Change**: +189 lines (+52%) for better structure
- **File Size Limit**: All files < 150 lines ✅

### Line Distribution
| File | Lines | Purpose |
|------|-------|---------|
| bulk-episode-generator.tsx | ~80 | Main orchestrator |
| use-bulk-generation.ts | ~100 | State machine + actions |
| selection-step.tsx | ~60 | Date range selection UI |
| preview-step.tsx | ~80 | Preview episodes UI |
| generating-step.tsx | ~30 | Loading state UI |
| completed-step.tsx | ~70 | Results UI |
| generation-footer.tsx | ~50 | Dialog footer buttons |
| episode-preview-list.tsx | ~40 | Episode list |
| generation-stats.tsx | ~40 | Stats display |
| types.ts | ~30 | TypeScript types |
| **Total** | **~580** | **10 files** |

### Benefits

1. **Maintainability**
   - Each file has single responsibility
   - Easy to locate and fix bugs
   - Clear separation of concerns

2. **Testability**
   - Hook can be tested independently
   - Step components can be tested in isolation
   - Easier to mock dependencies

3. **Reusability**
   - Step components reusable elsewhere
   - Hook pattern applicable to other wizards
   - Shared components (stats, list) reusable

4. **Developer Experience**
   - Easier to understand flow
   - Each file < 150 lines
   - Clear props/interfaces

5. **Type Safety**
   - Centralized type definitions
   - Proper interfaces for all components
   - Better IDE support

---

## Testing Considerations

### Unit Tests
- Test `useBulkGeneration` hook with `@testing-library/react-hooks`
- Test each step component in isolation
- Test shared components (list, stats, footer)

### Integration Tests
- Test full wizard flow
- Test server action error handling
- Test step transitions

### Manual Testing
1. Open bulk generator dialog
2. Select date range → verify preview
3. Generate episodes → verify loading state
4. Check completion → verify stats
5. Generate more → verify reset
6. Cancel → verify cleanup

---

## Migration Strategy

### Step-by-Step Migration
1. Create new directory structure alongside existing file
2. Build and test new components
3. Update parent import to use new structure
4. Run full build + manual testing
5. Delete old monolithic file
6. Commit changes

### Backward Compatibility
- No changes to public API
- Same props interface
- Same behavior
- No breaking changes for parent components

---

## Dependencies

### Existing Components (Keep)
- `EpisodeDateRangePicker` (already separate)
- shadcn/ui components (Dialog, Card, Badge, Alert, Button)
- lucide-react icons

### Server Actions (No Changes)
- `generateBulkEpisodes` from `@/lib/actions/episode-actions`
- `previewBulkEpisodes` from `@/lib/actions/episode-actions`

### Utilities (No Changes)
- `formatDateRange` from `@/lib/utils/episode-date-calculator`
- `BatchConfiguration` type from same file

---

## Success Criteria

✅ **Code Quality**
- [x] Main component < 100 lines
- [x] All files < 150 lines
- [x] TypeScript strict mode
- [x] No code duplication

✅ **Functionality**
- [x] All wizard steps work
- [x] Server actions called correctly
- [x] Error handling preserved
- [x] Toast notifications work
- [x] Router refresh works

✅ **Build**
- [x] `npm run build` passes
- [x] No TypeScript errors
- [x] No ESLint warnings
- [x] No unused imports

✅ **Testing**
- [x] Manual testing passes
- [x] All steps navigable
- [x] Generation completes successfully
- [x] Error states handled

✅ **Documentation**
- [x] Types well-documented
- [x] Props interfaces clear
- [x] Code comments where needed

---

## References

- **Patterns**: Container/Presenter (Task 5.6), Custom Hooks (Task 5.2), Component Composition (Task 5.1)
- **Similar Tasks**: Audio Player (Task 5.2), Image Generation Field (Task 5.1)
- **React Docs**: https://react.dev/learn/extracting-state-logic-into-a-reducer
- **Hook Patterns**: https://react.dev/learn/reusing-logic-with-custom-hooks
