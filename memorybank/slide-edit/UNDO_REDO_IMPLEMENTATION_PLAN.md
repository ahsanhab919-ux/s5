# Enhanced Undo/Redo Implementation Plan

**Feature:** Enhanced Undo/Redo System  
**Status:** Planning Phase  
**Estimated Time:** 2-3 hours  
**Priority:** High (Completes Phase 5)

---

## 📋 Executive Summary

Currently, the undo/redo system tracks changes in Redux but does not actually revert/reapply DOM changes. This plan outlines the implementation of a complete undo/redo system that:

1. Reverts/reapplies DOM changes based on change history
2. Supports all change types (text, position, style, delete, duplicate)
3. Includes keyboard shortcuts (Ctrl/Cmd+Z, Ctrl/Cmd+Shift+Z)
4. Enforces history limits (50 operations)
5. Provides visual feedback

---

## 🔍 Current State Analysis

### ✅ What Exists (Working)

1. **Redux State Management:**
   - `changeHistory`: Array of `Change` objects
   - `currentHistoryIndex`: Points to current position in history
   - `undo` action: Decrements `currentHistoryIndex`
   - `redo` action: Increments `currentHistoryIndex`
   - `trackChange` action: Adds changes to history

2. **Hook Structure:**
   - `useChangeTracking.ts`: Provides `undoChange()`, `redoChange()`, `canUndo`, `canRedo`
   - Connected to toolbar buttons

3. **Change Tracking:**
   - All change types track `data` and `previousData`
   - Changes are stored when operations occur

### ❌ What's Missing (Not Working)

1. **DOM Manipulation:**
   - `undo`/`redo` only update Redux index
   - No actual DOM changes are applied
   - Elements don't revert to previous state

2. **Change Type Handlers:**
   - No handlers to revert/reapply each change type
   - No logic to find and manipulate elements in iframe

3. **Keyboard Shortcuts:**
   - No keyboard event listeners
   - No prevention of default browser undo/redo

4. **History Limit:**
   - No enforcement of 50 operations limit

---

## 📊 Change Data Structure Analysis

Based on codebase review, here's how each change type stores data:

### 1. Text Changes (`type: "text"`)

```typescript
{
  data: {
    html: string,      // New HTML content (sanitized)
    text: string       // New text content
  },
  previousData: {
    html: string,      // Previous HTML content
    text: string       // Previous text content
  }
}
```

### 2. Position Changes (`type: "position"`)

```typescript
{
  data: {
    left: number,      // New left position
    top: number        // New top position
  },
  previousData: {
    left: number,      // Previous left position
    top: number        // Previous top position
  }
}
```

**Note:** Only keyboard navigation tracks position changes. Drag & drop does NOT track changes (potential future enhancement).

### 3. Style Changes (`type: "style"`)

```typescript
{
  data: {
    zIndex: number | string     // New z-index value
  },
  previousData: {
    zIndex: number | string     // Previous z-index value
  }
}
```

**Note:** Currently only layer ordering (z-index) is tracked. Full style editing (color, font, etc.) exists but is commented out.

### 4. Delete Changes (`type: "delete"`)

```typescript
{
  data: {
    deleted: true
  },
  previousData: {
    outerHTML: string,           // Full HTML of deleted element
    parentPath: string | null,   // CSS selector path to parent
    nextSiblingPath: string | null, // CSS selector path to next sibling
    elementPath: string          // CSS selector path to deleted element
  }
}
```

### 5. Duplicate Changes (`type: "duplicate"`)

```typescript
{
  data: {
    originalElementId: string,      // ID of original element
    originalElementPath: string,    // Path to original element
    offsetX: number,                // X offset of cloned element
    offsetY: number                 // Y offset of cloned element
  },
  previousData: {
    clonedElementHTML: string,      // HTML of cloned element
    originalElementHTML: string     // HTML of original element (at time of clone)
  }
}
```

---

## 🎯 Implementation Goals

### Primary Goals (Must Have)

1. ✅ **Revert/Reapply Logic:** Implement handlers for all 5 change types
2. ✅ **Integration:** Connect revert/reapply to Redux `undo`/`redo` actions
3. ✅ **Keyboard Shortcuts:** Add Ctrl/Cmd+Z and Ctrl/Cmd+Shift+Z
4. ✅ **Element Finding:** Robust element finding using `elementPath` and `elementId`
5. ✅ **Error Handling:** Handle cases where elements don't exist anymore

### Secondary Goals (Should Have)

6. ⚠️ **History Limit:** Enforce 50 operations limit
7. ⚠️ **Visual Feedback:** Disable buttons when no undo/redo available (partially done)
8. ⚠️ **Selection Sync:** Update selected element after undo/redo if needed

### Future Enhancements (Nice to Have)

9. 📝 **Drag & Drop Tracking:** Track position changes from drag & drop
10. 📝 **History Visualization:** Show history as a list
11. 📝 **localStorage Persistence:** Persist history across sessions

---

## 🏗️ Architecture Plan

### Option 1: Enhance Existing Hook (Recommended)

**File:** `src/hooks/presentation/useChangeTracking.ts`

**Approach:**

- Enhance `undoChange()` and `redoChange()` to actually manipulate DOM
- Add private helper functions for each change type
- Keep same API, just add DOM manipulation logic

**Pros:**

- Minimal changes to existing code
- Same API, no breaking changes
- All logic in one place

**Cons:**

- File might get large (but manageable)

### Option 2: Create New Hook + Enhance Existing

**Files:**

- `src/hooks/presentation/useUndoRedo.ts` (new)
- `src/hooks/presentation/useChangeTracking.ts` (modify)

**Approach:**

- Create `useUndoRedo.ts` with DOM manipulation logic
- Modify `useChangeTracking.ts` to use `useUndoRedo`
- Separate concerns

**Pros:**

- Better separation of concerns
- Easier to test
- More modular

**Cons:**

- More files to manage
- Need to coordinate between hooks

**Decision: Option 1 (Enhance Existing Hook)**

**Rationale:**

- Simpler implementation
- Less refactoring
- Faster to implement
- Can refactor later if needed

---

## 📝 Detailed Implementation Plan

### Step 1: Create Revert/Reapply Handlers

**Location:** `src/hooks/presentation/useChangeTracking.ts`

**New Functions to Add:**

#### 1.1 Helper: Get Element from Iframe

```typescript
function getElementFromIframe(
  iframeRef: React.RefObject<HTMLIFrameElement>,
  elementPath: string,
  elementId?: string,
): HTMLElement | null;
```

**Purpose:** Find element in iframe using path or ID  
**Fallback Strategy:** Try path → Try ID → Try selected class

#### 1.2 Handler: Revert Text Change

```typescript
function revertTextChange(
  change: Change,
  iframeRef: React.RefObject<HTMLIFrameElement>,
): boolean;
```

**Logic:**

- Find element using `elementPath` or `elementId`
- Set `element.innerHTML = change.previousData.html`
- Return success/failure

#### 1.3 Handler: Reapply Text Change

```typescript
function reapplyTextChange(
  change: Change,
  iframeRef: React.RefObject<HTMLIFrameElement>,
): boolean;
```

**Logic:**

- Find element using `elementPath` or `elementId`
- Set `element.innerHTML = change.data.html`
- Return success/failure

#### 1.4 Handler: Revert Position Change

```typescript
function revertPositionChange(
  change: Change,
  iframeRef: React.RefObject<HTMLIFrameElement>,
): boolean;
```

**Logic:**

- Find element
- Set `element.style.left = change.previousData.left + 'px'`
- Set `element.style.top = change.previousData.top + 'px'`
- Clear transform if present

#### 1.5 Handler: Reapply Position Change

```typescript
function reapplyPositionChange(
  change: Change,
  iframeRef: React.RefObject<HTMLIFrameElement>,
): boolean;
```

**Logic:**

- Find element
- Set `element.style.left = change.data.left + 'px'`
- Set `element.style.top = change.data.top + 'px'`

#### 1.6 Handler: Revert Style Change (z-index)

```typescript
function revertStyleChange(
  change: Change,
  iframeRef: React.RefObject<HTMLIFrameElement>,
): boolean;
```

**Logic:**

- Find element
- Set `element.style.zIndex = change.previousData.zIndex`
- Handle `null` or `undefined` (remove z-index)

#### 1.7 Handler: Reapply Style Change (z-index)

```typescript
function reapplyStyleChange(
  change: Change,
  iframeRef: React.RefObject<HTMLIFrameElement>,
): boolean;
```

**Logic:**

- Find element
- Set `element.style.zIndex = change.data.zIndex`

#### 1.8 Handler: Revert Delete Change (Restore Element)

```typescript
function revertDeleteChange(
  change: Change,
  iframeRef: React.RefObject<HTMLIFrameElement>,
): boolean;
```

**Logic:**

- Get iframe document
- Find parent element using `change.previousData.parentPath`
- Parse `change.previousData.outerHTML` to create element
- Find insertion point (next sibling or append)
- Insert element before next sibling or append to parent
- Restore element ID if it had one

#### 1.9 Handler: Reapply Delete Change (Delete Element)

```typescript
function reapplyDeleteChange(
  change: Change,
  iframeRef: React.RefObject<HTMLIFrameElement>,
): boolean;
```

**Logic:**

- Find element using `elementPath` or `elementId`
- Remove element from DOM using `parent.removeChild(element)`

#### 1.10 Handler: Revert Duplicate Change (Remove Clone)

```typescript
function revertDuplicateChange(
  change: Change,
  iframeRef: React.RefObject<HTMLIFrameElement>,
): boolean;
```

**Logic:**

- Find cloned element using `change.elementId` (the new ID assigned to clone)
- Remove cloned element from DOM
- Clear selection if cloned element was selected

#### 1.11 Handler: Reapply Duplicate Change (Restore Clone)

```typescript
function reapplyDuplicateChange(
  change: Change,
  iframeRef: React.RefObject<HTMLIFrameElement>,
): boolean;
```

**Logic:**

- Get iframe document
- Parse `change.previousData.clonedElementHTML` to create element
- Find original element using `change.data.originalElementPath`
- Insert clone after original (or at appropriate position)
- Restore clone's ID
- Update position with offset if needed

#### 1.12 Main Router Function

```typescript
function applyChange(
  change: Change,
  iframeRef: React.RefObject<HTMLIFrameElement>,
  isUndo: boolean,
): boolean;
```

**Logic:**

- Route to appropriate handler based on `change.type`
- If `isUndo`, call revert handler
- If not undo (redo), call reapply handler
- Return success/failure

---

### Step 2: Enhance undoChange and redoChange

**Location:** `src/hooks/presentation/useChangeTracking.ts`

**Modify Functions:**

#### 2.1 Enhanced undoChange

```typescript
const undoChange = useCallback(() => {
  if (!canUndo) return false;

  // Get change at current index
  const change = changeHistory[slide.currentHistoryIndex];
  if (!change) return false;

  // Apply revert logic
  const success = applyChange(change, iframeRef, true);

  if (success) {
    // Update Redux index
    dispatch(undo({ slideId }));
  }

  return success;
}, [dispatch, slideId, canUndo, changeHistory, iframeRef]);
```

#### 2.2 Enhanced redoChange

```typescript
const redoChange = useCallback(() => {
  if (!canRedo) return false;

  // Get next change (after current index)
  const nextIndex = slide.currentHistoryIndex + 1;
  const change = changeHistory[nextIndex];
  if (!change) return false;

  // Apply reapply logic
  const success = applyChange(change, iframeRef, false);

  if (success) {
    // Update Redux index
    dispatch(redo({ slideId }));
  }

  return success;
}, [dispatch, slideId, canRedo, changeHistory, iframeRef]);
```

**Issue:** Need `iframeRef` in `useChangeTracking` hook  
**Solution:** Add `iframeRef` as parameter to hook

---

### Step 3: Update Hook Signature

**Location:** `src/hooks/presentation/useChangeTracking.ts`

**Change:**

```typescript
// Before
export function useChangeTracking(slideId: string);

// After
export function useChangeTracking(
  slideId: string,
  iframeRef: React.RefObject<HTMLIFrameElement>,
);
```

**Update All Usages:**

- `src/components/presentation/editing/EditingToolbar.tsx`
- Any other files using this hook

---

### Step 4: Add Keyboard Shortcuts

**Location:** `src/hooks/presentation/useChangeTracking.ts`

**New useEffect:**

```typescript
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    // Check for Ctrl/Cmd + Z (undo)
    if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
      e.preventDefault();
      undoChange();
    }

    // Check for Ctrl/Cmd + Shift + Z (redo)
    if ((e.ctrlKey || e.metaKey) && e.key === "z" && e.shiftKey) {
      e.preventDefault();
      redoChange();
    }
  };

  document.addEventListener("keydown", handleKeyDown);
  return () => document.removeEventListener("keydown", handleKeyDown);
}, [undoChange, redoChange]);
```

**Note:** Only enable when editing mode is active (check `isEditing` from Redux)

---

### Step 5: Enforce History Limit with Circular Buffer

**Location:** `src/redux/slices/slideEditSlice.ts`

**Efficient Circular Buffer Implementation:**

```typescript
// Constants
const MAX_HISTORY = 50;

// In trackChange reducer:
// After creating change object, before adding to history:

// If history is at capacity, use circular buffer pattern
if (slide.changeHistory.length >= MAX_HISTORY) {
  // Remove oldest change (first in array)
  // This is O(1) if we use array shift, but we can optimize further
  slide.changeHistory.shift();

  // Adjust currentHistoryIndex if needed
  // If we removed a change before current index, decrement index
  if (slide.currentHistoryIndex >= MAX_HISTORY - 1) {
    // Current index was at the end, now it's at new end
    slide.currentHistoryIndex = MAX_HISTORY - 2;
  } else if (slide.currentHistoryIndex >= 0) {
    // Current index was in middle, shift it down by 1
    slide.currentHistoryIndex -= 1;
  }
  // Note: If currentHistoryIndex was -1, it stays -1
}

// Add new change to end of history
slide.changeHistory.push(change);
slide.currentHistoryIndex += 1;
slide.hasUnsavedChanges = true;
```

**Current Implementation Analysis:**

Looking at the existing code in `slideEditSlice.ts`, there's already a basic limit:

```typescript
// Current code (lines 154-160):
slide.changeHistory.push(change);
if (slide.changeHistory.length > 50) {
  slide.changeHistory.shift();
}
slide.currentHistoryIndex = slide.changeHistory.length - 1;
```

**Problem:** When we remove the oldest change with `shift()`, the `currentHistoryIndex` needs to be adjusted **before** we set it to `length - 1`. Otherwise, if we're in the middle of history and add a new change, the index calculation is wrong.

**Improved Implementation:**

```typescript
// Remove any changes after current index (when undoing and making new changes)
if (slide.currentHistoryIndex < slide.changeHistory.length - 1) {
  slide.changeHistory = slide.changeHistory.slice(
    0,
    slide.currentHistoryIndex + 1,
  );
}

// Check if we need to remove oldest change (circular buffer)
const MAX_HISTORY = 50;
if (slide.changeHistory.length >= MAX_HISTORY) {
  // Remove oldest change
  slide.changeHistory.shift();

  // Adjust currentHistoryIndex before adding new change
  // If we removed a change, all indices shift down by 1
  if (slide.currentHistoryIndex >= 0) {
    slide.currentHistoryIndex -= 1;
  }
  // If currentHistoryIndex was -1 (no history), it stays -1
}

// Add new change to end
slide.changeHistory.push(change);
slide.currentHistoryIndex = slide.changeHistory.length - 1;
slide.hasUnsavedChanges = true;
```

**Optimized Version (True Ring Buffer - Future Enhancement):**

For even better performance with large histories, we could use a true circular buffer:

```typescript
// Alternative: Use startIndex and endIndex for circular buffer
// This avoids array shifting (O(1) instead of O(n))
// But requires more complex index calculations
// For now, array-based approach is simpler and acceptable for 50 items

interface CircularBuffer<T> {
  buffer: T[];
  startIndex: number; // Points to oldest element
  endIndex: number; // Points to newest element
  size: number; // Current number of elements
  capacity: number; // Maximum capacity
}

// This would give O(1) add/remove operations
// But requires refactoring all index-based access
```

**Note:** Array shift is O(n), but for 50 items it's acceptable. The current improved implementation handles index adjustments correctly while maintaining simplicity.

---

### Step 6: Update Redux to Get Current Index

**Location:** `src/hooks/presentation/useChangeTracking.ts`

**Add Selector:**

```typescript
const currentHistoryIndex = useAppSelector(selectCurrentHistoryIndex(slideId));
```

**Create Selector:**

```typescript
// In slideEditSlice.ts
export const selectCurrentHistoryIndex = (slideId: string) =>
  createSelector([selectEditingSlide(slideId)], (slide) => {
    if (!slide) return -1;
    return slide.currentHistoryIndex;
  });
```

---

## 🔧 Technical Considerations

### 1. Element Finding Strategy

**Priority Order:**

1. Try `elementPath` (CSS selector)
2. Try `elementId` (if available)
3. Try `.element-selected` class (fallback)

**Why:**

- `elementPath` is most reliable (unique CSS selector)
- `elementId` is fast but not always present
- Selected class is last resort

### 2. Error Handling

**Scenarios to Handle:**

- Element not found (deleted, path changed)
- Parent element not found (for delete revert)
- Invalid HTML in `previousData`
- Iframe not ready

**Strategy:**

- Return `false` on error
- Log error to console for debugging
- **Show toast notification to user** using `useSnackbarHook()`
- Don't crash the app

**Implementation:**

```typescript
import { useSnackbarHook } from "@/providers/NotificationProvider";

// In useChangeTracking hook:
const { showErrorSnackbar } = useSnackbarHook();

// In error cases:
if (!element) {
  console.error("Undo/Redo failed: Element not found", { change });
  showErrorSnackbar("Cannot undo/redo: Element not found");
  return false;
}

if (!iframeDoc) {
  console.error("Undo/Redo failed: Iframe not ready");
  showErrorSnackbar("Cannot undo/redo: Editor not ready");
  return false;
}
```

### 3. Selection Sync

**After Undo/Redo:**

**Strategy:** Select the affected element, clear selection if element no longer exists

**Implementation Steps:**

1. **After undo/redo operation:**
   - Get the element that was affected by the change
   - Try to find it in the DOM using `elementPath` or `elementId`

2. **If element exists:**
   - Update Redux `selectedElement` state with element data
   - Send `SELECT_ELEMENT` postMessage to iframe
   - Element will get `.element-selected` class

3. **If element doesn't exist (e.g., deleted):**
   - Clear Redux `selectedElement` (set to null)
   - Send `CLEAR_SELECTION` message to iframe (if such message exists)
   - Or simply don't select anything

4. **Helper Function:**

   ```typescript
   function syncSelectionAfterUndoRedo(
     change: Change,
     iframeRef: React.RefObject<HTMLIFrameElement>,
     dispatch: AppDispatch,
   ): void {
     const element = getElementFromIframe(
       iframeRef,
       change.elementPath,
       change.elementId,
     );

     if (element) {
       // Get element data and update Redux
       const elementData = getElementData(element, change.elementPath);
       dispatch(setSelectedElement({ slideId, element: elementData }));

       // Send selection message to iframe
       iframeRef.current?.contentWindow?.postMessage(
         {
           type: "SELECT_ELEMENT",
           elementPath: change.elementPath,
         },
         "*",
       );
     } else {
       // Clear selection
       dispatch(setSelectedElement({ slideId, element: null }));
     }
   }
   ```

### 4. Performance

**Optimizations:**

- Batch DOM updates if multiple changes
- Use `requestAnimationFrame` for smooth updates
- Debounce rapid undo/redo (if needed)

**Not Needed Initially:**

- Virtual scrolling for history
- Lazy loading of change data

---

## 📋 Implementation Checklist

### Phase 1: Core Functionality

- [ ] Add `iframeRef` parameter to `useChangeTracking` hook
- [ ] Import `useSnackbarHook` for error notifications
- [ ] Create `getElementFromIframe` helper function
- [ ] Create revert/reapply handlers for all 5 change types
- [ ] Create `applyChange` router function
- [ ] Create `syncSelectionAfterUndoRedo` helper function
- [ ] Enhance `undoChange` to call revert logic + sync selection
- [ ] Enhance `redoChange` to call reapply logic + sync selection
- [ ] Add error handling with toast notifications
- [ ] Update all usages of `useChangeTracking` hook

### Phase 2: Keyboard Shortcuts

- [ ] Add keyboard event listener in `useEffect`
- [ ] Handle Ctrl/Cmd+Z for undo
- [ ] Handle Ctrl/Cmd+Shift+Z for redo
- [ ] Prevent default browser behavior
- [ ] Only enable when editing mode is active

### Phase 3: History Limit (Circular Buffer)

- [ ] Add `MAX_HISTORY` constant (50)
- [ ] Modify `trackChange` reducer to use circular buffer pattern
- [ ] Implement efficient removal of oldest change (O(1) where possible)
- [ ] Adjust `currentHistoryIndex` correctly when removing old changes
- [ ] Test with more than 50 changes (verify oldest removed correctly)
- [ ] Test edge cases (undo to beginning, then add new change)

### Phase 4: Testing & Polish

- [ ] Test undo/redo for text changes
- [ ] Test undo/redo for position changes (keyboard nav only)
- [ ] Test undo/redo for style changes (z-index)
- [ ] Test undo/redo for delete changes
- [ ] Test undo/redo for duplicate changes
- [ ] Test keyboard shortcuts
- [ ] Test history limit enforcement (circular buffer)
- [ ] Test error cases (element not found, etc.) - verify toast shows
- [ ] Test rapid undo/redo
- [ ] Verify selection sync after undo/redo (selects affected element)
- [ ] Verify selection clears when element doesn't exist
- [ ] Test toast notifications appear on errors

---

## ✅ Decisions Made

### Decision 1: Drag & Drop Position Tracking

**Answer:** ❌ **DO NOT include drag & drop tracking**  
**Rationale:** Keep it simple for MVP. Only keyboard navigation tracks position changes.

### Decision 2: Selection Sync Strategy

**Answer:** ✅ **Select the affected element after undo/redo, clear selection if element no longer exists**

**Implementation:**

- After undo/redo, find the element affected by the change
- If element exists, select it (update Redux state and send SELECT_ELEMENT message to iframe)
- If element doesn't exist (e.g., deleted), clear selection

### Decision 3: Error User Feedback

**Answer:** ✅ **Show toast notification when undo/redo fails**

**Implementation:**

- Use `useSnackbarHook()` from `NotificationProvider`
- Call `showErrorSnackbar("Failed to undo/redo: Element not found")` on failure
- Also log to console for debugging

### Decision 4: History Limit Behavior

**Answer:** ✅ **Use circular buffer pattern - remove oldest, add newest efficiently**

**Implementation:**

- Use circular buffer data structure (ring buffer)
- When limit reached, remove oldest change (O(1) operation)
- Maintain efficient indexing with modulo arithmetic
- Optimize for O(1) add/remove operations

---

## 🚀 Implementation Order

1. **Step 1:** Create revert/reapply handlers (core logic)
2. **Step 2:** Enhance undo/redo functions
3. **Step 3:** Update hook signature and usages
4. **Step 4:** Add keyboard shortcuts
5. **Step 5:** Enforce history limit
6. **Step 6:** Testing and bug fixes

**Estimated Time per Step:**

- Step 1: 1.5-2 hours (includes selection sync and error handling)
- Step 2: 20-30 minutes (enhance undo/redo with selection sync)
- Step 3: 15-30 minutes (update hook signature)
- Step 4: 15-30 minutes (keyboard shortcuts)
- Step 5: 20-30 minutes (circular buffer implementation)
- Step 6: 30-60 minutes (testing all scenarios)

**Total: 3-4.5 hours**

---

## 📝 Notes

- **Drag & Drop:** Does NOT track position changes per decision. Only keyboard navigation tracks position changes for undo/redo.
- **Full Style Editing:** Style editing (color, font, etc.) exists but is commented out. When enabled, will need to extend style change handler.
- **Browser Undo/Redo:** We prevent default behavior, but contentEditable might still have its own undo/redo. May need to handle this.
- **Circular Buffer:** Using array-based approach (shift/push) for simplicity. For 50 items, O(n) shift is acceptable. Can optimize to true ring buffer later if needed.
- **Toast Notifications:** Using `useSnackbarHook()` from `NotificationProvider` for error messages.
- **Selection Sync:** After undo/redo, we select the affected element. If element doesn't exist, we clear selection.

---

## ✅ Success Criteria

1. ✅ Undo button reverts last change
2. ✅ Redo button reapplies undone change
3. ✅ Keyboard shortcuts work (Ctrl/Cmd+Z, Shift+Z)
4. ✅ All change types can be undone/redone
5. ✅ History limit of 50 is enforced
6. ✅ No errors when elements don't exist
7. ✅ Selection is maintained/updated appropriately
8. ✅ Works with iframe content

---

**Plan Created:** Current Session  
**Status:** Ready for Review  
**Next Step:** Get approval and start implementation
