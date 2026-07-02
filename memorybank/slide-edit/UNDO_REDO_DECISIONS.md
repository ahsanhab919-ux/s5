# Undo/Redo Implementation - Key Decisions

**Date:** Current Session  
**Status:** Approved - Ready for Implementation

---

## ✅ Approved Decisions

### 1. Drag & Drop Position Tracking

**Decision:** ❌ **DO NOT include drag & drop tracking in undo/redo**

**Rationale:**

- Keep implementation simple for MVP
- Only keyboard navigation tracks position changes
- Drag & drop can be added in future enhancement if needed

**Impact:**

- No changes needed to `useDragAndDrop.ts`
- Undo/redo only works for keyboard-based position changes

---

### 2. Selection Sync Strategy

**Decision:** ✅ **Select the affected element after undo/redo, clear selection if element no longer exists**

**Implementation:**

- After undo/redo operation completes:
  1. Find the element affected by the change
  2. **If element exists:** Select it (update Redux + send SELECT_ELEMENT message to iframe)
  3. **If element doesn't exist:** Clear selection (set to null in Redux)

**Benefits:**

- User always sees what was affected by undo/redo
- Clear visual feedback
- Prevents confusion about selected element

---

### 3. Error User Feedback

**Decision:** ✅ **Show toast notification when undo/redo fails**

**Implementation:**

- Use `useSnackbarHook()` from `NotificationProvider`
- Call `showErrorSnackbar("Cannot undo/redo: Element not found")` on failure
- Also log errors to console for debugging

**Example Messages:**

- "Cannot undo/redo: Element not found"
- "Cannot undo/redo: Editor not ready"
- "Cannot undo/redo: Invalid operation"

**Benefits:**

- User knows why undo/redo failed
- Better UX than silent failures
- Helps with debugging

---

### 4. History Limit Behavior

**Decision:** ✅ **Use circular buffer pattern - efficiently remove oldest, add newest**

**Implementation Strategy:**

- Use array-based circular buffer (simpler for 50 items)
- When limit (50) is reached:
  1. Remove oldest change using `shift()` (O(n) but acceptable for 50 items)
  2. Adjust `currentHistoryIndex` correctly before adding new change
  3. Add new change to end using `push()` (O(1))

**Key Points:**

- Must adjust `currentHistoryIndex` **before** removing oldest change
- Maintains correct index tracking even when at capacity
- Efficient enough for 50 items (O(n) shift is acceptable)
- Can optimize to true ring buffer later if needed (O(1) operations)

**Edge Cases to Handle:**

- User undoes to beginning, then makes new change
- User at middle of history, limit reached, adds new change
- History is full (50 items), user adds 51st change

---

## 📋 Implementation Checklist

### Phase 1: Core Functionality

- [ ] Add `iframeRef` parameter to `useChangeTracking` hook
- [ ] Import `useSnackbarHook` for error notifications
- [ ] Create revert/reapply handlers for all 5 change types
- [ ] Create `syncSelectionAfterUndoRedo` helper
- [ ] Enhance undo/redo with selection sync + error handling

### Phase 2: Keyboard Shortcuts

- [ ] Add Ctrl/Cmd+Z for undo
- [ ] Add Ctrl/Cmd+Shift+Z for redo
- [ ] Only enable when editing mode is active

### Phase 3: History Limit

- [ ] Fix `trackChange` reducer to properly adjust `currentHistoryIndex`
- [ ] Test circular buffer with 50+ changes
- [ ] Test edge cases (undo to beginning, then add change)

### Phase 4: Testing

- [ ] Test all change types (text, position, style, delete, duplicate)
- [ ] Test error cases (verify toast notifications)
- [ ] Test selection sync (selects affected element, clears if not found)
- [ ] Test keyboard shortcuts
- [ ] Test history limit enforcement

---

## 🔧 Technical Details

### Toast Notifications

- **Hook:** `useSnackbarHook()` from `@/providers/NotificationProvider`
- **Method:** `showErrorSnackbar(message: string)`
- **Usage:** Show on all undo/redo failures

### Selection Sync

- **Function:** `syncSelectionAfterUndoRedo(change, iframeRef, dispatch)`
- **Redux Action:** `setSelectedElement({ slideId, element })`
- **Iframe Message:** `{ type: "SELECT_ELEMENT", elementPath }`

### Circular Buffer

- **Current Approach:** Array with `shift()` and `push()`
- **Complexity:** O(n) for shift, O(1) for push
- **Acceptable because:** Only 50 items max
- **Future Optimization:** True ring buffer with start/end pointers (O(1) for both)

---

## ✅ Success Criteria

1. ✅ Undo/redo works for all 5 change types
2. ✅ Toast notifications show on errors
3. ✅ Selection syncs to affected element (or clears if not found)
4. ✅ Keyboard shortcuts work (Ctrl/Cmd+Z, Shift+Z)
5. ✅ History limit of 50 enforced correctly
6. ✅ No errors when elements don't exist
7. ✅ Circular buffer maintains correct indices

---

**Status:** Ready for Implementation  
**Estimated Time:** 3-4.5 hours
