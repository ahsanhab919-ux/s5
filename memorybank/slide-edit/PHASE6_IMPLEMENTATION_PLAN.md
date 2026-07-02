# Phase 6: Polish & Optimization - Concrete Implementation Plan

**Current Status:** Quick Wins Complete (JSDoc + React.memo ✅)  
**Remaining Tasks:** Error Handling, Performance, Testing, Documentation

---

## ✅ Already Completed

- ✅ **JSDoc Comments** - All hooks and components documented
- ✅ **React.memo** - ResizeHandles, EditingToolbar, GridOverlay, AlignmentGuides
- ✅ **Error Messages** - User-facing messages exist (toast notifications)

---

## 📋 Remaining Tasks (Prioritized)

### 1. Error Handling Improvements (2-3 hours) - **HIGH PRIORITY**

#### 1.1 Enhance Error Boundaries

**Current State:**

- `EditingErrorBoundary.tsx` exists but only wraps iframe content
- Need error boundaries for individual editing components

**Tasks:**

- [ ] Wrap `EditingToolbar` with error boundary
- [ ] Wrap `ResizeHandles` with error boundary
- [ ] Add error recovery button in error boundary
- [ ] Improve error logging (add context: slideId, elementPath, operation)

**Files to Modify:**

- `src/components/presentation/editing/EditingErrorBoundary.tsx` (enhance)
- `src/components/presentation/SlidePreview.jsx` (add boundaries)

**Implementation:**

```tsx
// Wrap components in SlidePreview.jsx
<EditingErrorBoundary>
  <EditingToolbar ... />
</EditingErrorBoundary>

<EditingErrorBoundary>
  <ResizeHandles ... />
</EditingErrorBoundary>
```

---

### 2. Code Splitting & Lazy Loading (1-2 hours) - **MEDIUM PRIORITY**

**Current State:**

- Project uses `next/dynamic` for other components
- Editing components are loaded eagerly

**Tasks:**

- [ ] Lazy load `EditingToolbar` component
- [ ] Lazy load `ResizeHandles` component
- [ ] Lazy load `GridOverlay` component
- [ ] Lazy load `AlignmentGuides` component
- [ ] Add loading skeletons for lazy-loaded components

**Files to Modify:**

- `src/components/presentation/SlidePreview.jsx`

**Implementation:**

```tsx
// Use next/dynamic for lazy loading
const EditingToolbar = dynamic(() => import("./editing/EditingToolbar"), {
  ssr: false,
});

const ResizeHandles = dynamic(() => import("./editing/ResizeHandles"), {
  ssr: false,
});
```

---

### 3. Unit Tests with Vitest (4-6 hours) - **HIGH PRIORITY**

**Current State:**

- Vitest is installed (`^4.0.6`)
- One test file exists (`src/lib/logger.test.ts`)
- No tests for editing hooks yet

**Tasks:**

- [ ] Set up test utilities (mocks for iframe, Redux store)
- [ ] Write unit tests for `useChangeTracking` (undo/redo logic)
- [ ] Write unit tests for `useElementDeletion` (deletion logic)
- [ ] Write unit tests for `useElementDuplication` (duplication logic)
- [ ] Write unit tests for `useKeyboardNavigation` (keyboard movement)
- [ ] Write unit tests for `useLayerOrdering` (z-index changes)
- [ ] Write unit tests for `useAutoSave` (auto-save logic)

**Files to Create:**

- `src/hooks/presentation/__tests__/useChangeTracking.test.ts`
- `src/hooks/presentation/__tests__/useElementDeletion.test.ts`
- `src/hooks/presentation/__tests__/useElementDuplication.test.ts`
- `src/hooks/presentation/__tests__/useKeyboardNavigation.test.ts`
- `src/hooks/presentation/__tests__/useLayerOrdering.test.ts`
- `src/hooks/presentation/__tests__/useAutoSave.test.ts`
- `src/hooks/presentation/__tests__/__mocks__/iframeMock.ts`
- `src/hooks/presentation/__tests__/__mocks__/reduxMock.ts`

**Test Coverage Goal:** 80%+ for hooks

---

### 4. Documentation (2-3 hours) - **MEDIUM PRIORITY**

**Tasks:**

- [ ] **Architecture Documentation** - Create `docs/ARCHITECTURE.md`
  - File structure
  - Data flow (Redux → Components)
  - Hook dependencies
  - Iframe communication pattern
- [ ] **Developer Guide** - Create `docs/DEVELOPER_GUIDE.md`
  - How to add new editing features
  - How to add new change types
  - How to extend undo/redo
  - Code style guidelines

**Files to Create:**

- `docs/ARCHITECTURE.md`
- `docs/DEVELOPER_GUIDE.md`

---

## 🚀 Recommended Implementation Order

### Step 1: Error Handling (2-3 hours) ⭐ START HERE

**Why:** Prevents crashes and improves user experience

1. Enhance `EditingErrorBoundary` with better logging
2. Wrap editing components with error boundaries
3. Add error recovery mechanisms

---

### Step 2: Code Splitting (1-2 hours)

**Why:** Improves initial load time

1. Lazy load editing components
2. Add loading skeletons
3. Test bundle size reduction

---

### Step 3: Unit Tests (4-6 hours) ⭐ HIGH VALUE

**Why:** Ensures code quality and prevents regressions

1. Set up test utilities and mocks
2. Write tests for critical hooks
3. Achieve 80%+ coverage

---

### Step 4: Documentation (2-3 hours)

**Why:** Helps with maintenance and onboarding

1. Create architecture docs
2. Create developer guide
3. Document key patterns

---

## 📊 Estimated Timeline

| Task           | Time      | Priority | Status |
| -------------- | --------- | -------- | ------ |
| Error Handling | 2-3h      | High     | ⬜     |
| Code Splitting | 1-2h      | Medium   | ⬜     |
| Unit Tests     | 4-6h      | High     | ⬜     |
| Documentation  | 2-3h      | Medium   | ⬜     |
| **Total**      | **9-14h** |          |        |

---

## 🎯 Success Criteria

Phase 6 is complete when:

- ✅ All editing components have error boundaries
- ✅ Editing components are lazy-loaded
- ✅ Critical hooks have unit tests (80%+ coverage)
- ✅ Architecture is documented
- ✅ Code is production-ready

---

## 📝 Next Steps

**Which task should we tackle first?**

1. **Error Handling** (2-3h) - Enhance error boundaries
2. **Code Splitting** (1-2h) - Lazy load editing components
3. **Unit Tests** (4-6h) - Write tests for hooks
4. **Documentation** (2-3h) - Create architecture docs
5. **All of the above** - Complete Phase 6 (9-14h)

---

**Recommendation:** Start with **Error Handling** (highest impact, quick win), then move to **Unit Tests** (high value for production readiness).
