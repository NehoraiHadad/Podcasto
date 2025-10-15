# Task 5.10: Implement Consistent Loading & Error States

## Task Objective
Add consistent loading states (Suspense boundaries) and error boundaries across all application routes following Next.js 15 best practices and 2025 patterns.

## Current State Analysis

### Existing Loading States (3 files)
- ✅ `src/app/podcasts/loading.tsx` (39 lines)
- ✅ `src/app/podcasts/[id]/loading.tsx`
- ✅ `src/app/podcasts/[id]/episodes/[episodeId]/loading.tsx`

### Missing Loading States (14 routes)
**Admin Routes**:
1. `src/app/admin/loading.tsx` - Admin dashboard
2. `src/app/admin/episodes/loading.tsx` - Episodes list
3. `src/app/admin/episodes/[id]/loading.tsx` - Episode details
4. `src/app/admin/episodes/[id]/edit/loading.tsx` - Episode edit
5. `src/app/admin/podcasts/loading.tsx` - Podcasts list
6. `src/app/admin/podcasts/[id]/loading.tsx` - Podcast details
7. `src/app/admin/podcasts/create/loading.tsx` - Create podcast

**User Routes**:
8. `src/app/profile/loading.tsx` - User profile
9. `src/app/settings/notifications/loading.tsx` - Settings

**Public Routes**:
10. `src/app/page.tsx` (home) - Already server component, may not need
11. `src/app/about/loading.tsx` - About page
12. `src/app/contact/loading.tsx` - Contact form

**Auth Routes** (likely don't need loading states):
- Auth pages are usually instant, no async data

### Existing Error Boundaries
- ❌ No error.tsx files found in app directory
- Only `src/app/auth/error/page.tsx` (not a boundary, just an error display page)

### Problems

1. **Inconsistent Loading States**
   - Only 3 out of ~20+ routes have loading states
   - No admin routes have loading UI
   - Poor UX during data fetching

2. **No Error Boundaries**
   - Errors crash the entire page
   - No graceful error recovery
   - No user-friendly error messages

3. **Repetitive Code**
   - Each loading file duplicates skeleton structure
   - No shared loading components
   - Hard to maintain consistent UI

4. **Missing Suspense Boundaries**
   - No strategic Suspense usage in components
   - All-or-nothing loading approach

---

## Future State Design

### Target Structure

```
src/app/
├── loading.tsx (root fallback)
├── error.tsx (root boundary)
├── admin/
│   ├── loading.tsx
│   ├── error.tsx
│   ├── episodes/
│   │   ├── loading.tsx
│   │   ├── error.tsx
│   │   ├── [id]/
│   │   │   ├── loading.tsx
│   │   │   ├── error.tsx
│   │   │   └── edit/
│   │   │       ├── loading.tsx
│   │   │       └── error.tsx
│   └── podcasts/
│       ├── loading.tsx
│       ├── error.tsx
│       ├── [id]/
│       │   ├── loading.tsx
│       │   └── error.tsx
│       └── create/
│           ├── loading.tsx
│           └── error.tsx
├── podcasts/ (✅ already has loading)
├── profile/
│   ├── loading.tsx
│   └── error.tsx
└── settings/
    └── notifications/
        ├── loading.tsx
        └── error.tsx

src/components/loading/ (shared skeleton components)
├── index.ts
├── types.ts
├── page-loading.tsx (generic page skeleton)
├── table-loading.tsx (table skeleton)
├── form-loading.tsx (form skeleton)
├── card-grid-loading.tsx (grid of cards)
└── details-loading.tsx (detail page skeleton)

src/components/errors/ (shared error components)
├── index.ts
├── types.ts
├── error-boundary.tsx (reusable boundary)
├── error-display.tsx (error UI)
└── error-actions.tsx (retry, home buttons)
```

### Design Patterns

#### 1. Shared Loading Components Pattern
Create reusable skeleton components for common layouts:

```tsx
// components/loading/card-grid-loading.tsx
interface CardGridLoadingProps {
  count?: number;
  columns?: 1 | 2 | 3 | 4;
  showHeader?: boolean;
}

export function CardGridLoading({
  count = 6,
  columns = 3,
  showHeader = true
}: CardGridLoadingProps) {
  return (
    <div className="space-y-6">
      {showHeader && (
        <div className="text-center mb-12">
          <Skeleton className="h-10 w-64 mx-auto mb-4" />
          <Skeleton className="h-6 w-96 mx-auto" />
        </div>
      )}

      <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-${columns} gap-6`}>
        {Array.from({ length: count }).map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <Skeleton className="h-48 w-full" />
            <CardHeader>
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4" />
            </CardContent>
            <CardFooter>
              <Skeleton className="h-10 w-full" />
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

```tsx
// components/loading/table-loading.tsx
export function TableLoading({ rows = 10, columns = 5 }: TableLoadingProps) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-32" />
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              {Array.from({ length: columns }).map((_, i) => (
                <TableHead key={i}>
                  <Skeleton className="h-4 w-full" />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: rows }).map((_, i) => (
              <TableRow key={i}>
                {Array.from({ length: columns }).map((_, j) => (
                  <TableCell key={j}>
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
```

```tsx
// components/loading/form-loading.tsx
export function FormLoading({ fields = 5 }: FormLoadingProps) {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48 mb-8" /> {/* Title */}

      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-24" /> {/* Label */}
          <Skeleton className="h-10 w-full" /> {/* Input */}
        </div>
      ))}

      <div className="flex gap-4 pt-4">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-24" />
      </div>
    </div>
  );
}
```

#### 2. Error Boundary Pattern
Reusable error boundary component:

```tsx
// components/errors/error-boundary.tsx
'use client';

interface ErrorBoundaryProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export function ErrorBoundary({ error, reset }: ErrorBoundaryProps) {
  useEffect(() => {
    // Log error to monitoring service
    console.error('Error boundary caught:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <CardTitle>Something went wrong</CardTitle>
          </div>
          <CardDescription>
            We encountered an unexpected error. Please try again.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {process.env.NODE_ENV === 'development' && (
            <Alert>
              <AlertDescription className="font-mono text-xs overflow-auto">
                {error.message}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>

        <CardFooter className="flex gap-2">
          <Button onClick={reset} variant="default">
            Try again
          </Button>
          <Button onClick={() => window.location.href = '/'} variant="outline">
            Go home
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
```

#### 3. Route-Specific Loading Files
Use shared components in route loading files:

```tsx
// app/admin/episodes/loading.tsx
import { MainLayout } from '@/components/layout/main-layout';
import { TableLoading } from '@/components/loading';

export default function EpisodesLoading() {
  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <TableLoading rows={10} columns={6} />
      </div>
    </MainLayout>
  );
}
```

```tsx
// app/admin/podcasts/loading.tsx
import { MainLayout } from '@/components/layout/main-layout';
import { CardGridLoading } from '@/components/loading';

export default function AdminPodcastsLoading() {
  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <CardGridLoading count={6} columns={3} showHeader={true} />
      </div>
    </MainLayout>
  );
}
```

---

## Implementation Plan

### Phase 1: Create Shared Loading Components
1. Create directory: `src/components/loading/`
2. Create `types.ts` with interfaces
3. Create 5 shared loading components:
   - `page-loading.tsx` - Generic page skeleton
   - `card-grid-loading.tsx` - Grid of card skeletons
   - `table-loading.tsx` - Table skeleton
   - `form-loading.tsx` - Form skeleton
   - `details-loading.tsx` - Detail page skeleton
4. Create `index.ts` for exports

### Phase 2: Create Shared Error Components
1. Create directory: `src/components/errors/`
2. Create `types.ts` with interfaces
3. Create 3 error components:
   - `error-boundary.tsx` - Main error boundary UI
   - `error-display.tsx` - Error message display
   - `error-actions.tsx` - Retry/home buttons
4. Create `index.ts` for exports

### Phase 3: Add Admin Loading States (7 files)
1. `src/app/admin/loading.tsx` - Dashboard (CardGridLoading)
2. `src/app/admin/episodes/loading.tsx` - Episodes list (TableLoading)
3. `src/app/admin/episodes/[id]/loading.tsx` - Episode details (DetailsLoading)
4. `src/app/admin/episodes/[id]/edit/loading.tsx` - Edit form (FormLoading)
5. `src/app/admin/podcasts/loading.tsx` - Podcasts list (CardGridLoading)
6. `src/app/admin/podcasts/[id]/loading.tsx` - Podcast details (DetailsLoading)
7. `src/app/admin/podcasts/create/loading.tsx` - Create form (FormLoading)

### Phase 4: Add User Loading States (2 files)
1. `src/app/profile/loading.tsx` - User profile
2. `src/app/settings/notifications/loading.tsx` - Settings

### Phase 5: Add Error Boundaries (9 files)
1. Root: `src/app/error.tsx`
2. Admin: `src/app/admin/error.tsx`
3. Episodes: `src/app/admin/episodes/error.tsx`
4. Episode details: `src/app/admin/episodes/[id]/error.tsx`
5. Episode edit: `src/app/admin/episodes/[id]/edit/error.tsx`
6. Podcasts: `src/app/admin/podcasts/error.tsx`
7. Podcast details: `src/app/admin/podcasts/[id]/error.tsx`
8. Profile: `src/app/profile/error.tsx`
9. Settings: `src/app/settings/notifications/error.tsx`

### Phase 6: Refactor Existing Loading States (3 files)
1. Update `src/app/podcasts/loading.tsx` to use CardGridLoading
2. Update `src/app/podcasts/[id]/loading.tsx` to use DetailsLoading
3. Update `src/app/podcasts/[id]/episodes/[episodeId]/loading.tsx` to use DetailsLoading

---

## Expected Impact

### Code Metrics
- **New Shared Components**: 8 files (~400 lines)
- **New Loading States**: 9 files (~180 lines, using shared components)
- **New Error Boundaries**: 9 files (~90 lines, using shared component)
- **Refactored Loading States**: 3 files (~60 lines)
- **Total New Code**: 26 files, ~730 lines

### Coverage
- **Loading States**: 3 → 12 routes (+400% coverage)
- **Error Boundaries**: 0 → 9 routes (from nothing to comprehensive)
- **Code Reuse**: ~70% reduction in loading code through shared components

### Benefits

1. **User Experience**
   - Smooth loading transitions on every route
   - Clear feedback during data fetching
   - Graceful error recovery
   - No more blank screens or crashes

2. **Developer Experience**
   - Consistent patterns across app
   - Reusable components = less code
   - Easy to add loading/error to new routes
   - TypeScript interfaces for consistency

3. **Maintainability**
   - Single source of truth for loading UI
   - Easy to update all loading states at once
   - Clear error handling strategy
   - Better debugging with error boundaries

4. **Performance**
   - Next.js automatic code splitting with loading.tsx
   - Suspense-based rendering optimization
   - Progressive loading of content

5. **Best Practices**
   - Follows Next.js 15 conventions
   - React 18 Suspense patterns
   - 2025 error boundary patterns
   - Accessibility-friendly skeletons

---

## Testing Considerations

### Manual Testing
1. Navigate to each route → verify loading state shows
2. Throw error in page component → verify error boundary catches
3. Click "Try again" → verify reset works
4. Check responsive design on mobile
5. Verify keyboard navigation works
6. Test with slow network throttling

### Accessibility
- Skeleton components should have proper ARIA labels
- Error boundaries should be keyboard accessible
- Focus management on error/retry

---

## Migration Strategy

### Step-by-Step Migration
1. Create shared loading components (Phase 1)
2. Create shared error components (Phase 2)
3. Add loading states to admin routes (Phase 3)
4. Add loading states to user routes (Phase 4)
5. Add error boundaries (Phase 5)
6. Refactor existing loading states (Phase 6)
7. Run full build + manual testing
8. Commit changes

### Backward Compatibility
- Existing pages continue to work
- No breaking changes
- Progressive enhancement only

---

## Dependencies

### Existing Components (Keep)
- `@/components/ui/skeleton` (shadcn/ui)
- `@/components/ui/card` (shadcn/ui)
- `@/components/ui/alert` (shadcn/ui)
- `@/components/ui/button` (shadcn/ui)
- `@/components/layout/main-layout`
- lucide-react icons

### Next.js 15 Features
- `loading.tsx` - Automatic loading UI
- `error.tsx` - Error boundary
- Suspense boundaries (automatic with loading.tsx)

---

## Success Criteria

✅ **Coverage**
- [ ] All admin routes have loading states
- [ ] All user routes have loading states
- [ ] All public routes have loading states (where appropriate)
- [ ] All dynamic routes have error boundaries
- [ ] Root error boundary exists

✅ **Code Quality**
- [ ] Shared components < 100 lines each
- [ ] All files use TypeScript strict mode
- [ ] No code duplication
- [ ] Proper component composition

✅ **Functionality**
- [ ] Loading states show during navigation
- [ ] Error boundaries catch and display errors
- [ ] "Try again" button works
- [ ] "Go home" button works
- [ ] Keyboard navigation works

✅ **Build**
- [ ] `npm run build` passes
- [ ] No TypeScript errors
- [ ] No ESLint warnings
- [ ] No console errors

✅ **User Experience**
- [ ] Smooth transitions
- [ ] No blank screens
- [ ] Clear error messages
- [ ] Consistent UI across routes

---

## References

- **Next.js 15 Loading UI**: https://nextjs.org/docs/app/building-your-application/routing/loading-ui-and-streaming
- **Next.js 15 Error Handling**: https://nextjs.org/docs/app/building-your-application/routing/error-handling
- **React 18 Suspense**: https://react.dev/reference/react/Suspense
- **Error Boundaries**: https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary
- **Skeleton Patterns**: https://ui.shadcn.com/docs/components/skeleton
