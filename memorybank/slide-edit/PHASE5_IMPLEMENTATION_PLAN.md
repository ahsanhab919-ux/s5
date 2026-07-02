# Phase 5: Advanced Features - Concrete Implementation Plan

**Status:** Ready for Implementation  
**Estimated Duration:** 5-7 days  
**Priority:** High (Completes core editing functionality)

---

## Executive Summary

Phase 5 completes the slide editing feature set by adding:

1. **Element Deletion** - Safe deletion with undo support
2. **Element Duplication** - Smart cloning with offset positioning
3. **Save & Persistence** - Auto-save, manual save, conflict resolution
4. **Enhanced Undo/Redo** - Full command history with visual feedback

This phase ensures all changes are properly tracked, persisted, and recoverable.

---

## 1. Architecture Overview

### 1.1 File Structure

```
src/
├── services/
│   └── presentation/
│       └── slideEditService.ts          # NEW: API service for saving slides
├── hooks/
│   └── presentation/
│       ├── useElementDeletion.ts        # NEW: Element deletion logic
│       ├── useElementDuplication.ts      # NEW: Element duplication logic
│       ├── useAutoSave.ts                # NEW: Auto-save hook
│       └── useUndoRedo.ts                # NEW: Enhanced undo/redo (or enhance existing)
├── components/
│   └── presentation/
│       └── editing/
│           ├── DeleteConfirmDialog.tsx   # NEW: Confirmation dialog
│           └── SaveStatusIndicator.tsx   # NEW: Save status UI
├── redux/
│   ├── slices/
│   │   └── slideEditSlice.ts             # MODIFY: Add save state, delete/duplicate actions
│   └── api/
│       └── presentation/
│           └── presentationApi.js        # MODIFY: Add saveSlide mutation
└── lib/
    └── presentation/
        └── editing/
            └── editorCommands.ts         # MODIFY: Add DeleteCommand, DuplicateCommand
```

---

## 2. Implementation Tasks

### Task 1: Element Deletion (Day 1)

#### 2.1.1 Create Deletion Hook (`useElementDeletion.ts`)

**Purpose:** Handle element deletion with undo support and safety checks

**Features:**

- Soft delete (mark as deleted, store for undo)
- Store element data before deletion
- Track deletion in Redux history
- Support undo operation
- Validate element can be deleted (not body/html)

**Implementation:**

```typescript
// hooks/presentation/useElementDeletion.ts

interface UseElementDeletionOptions {
  onDelete?: (elementId: string) => void;
  requireConfirmation?: boolean;
}

export function useElementDeletion(
  slideId: string,
  elementPath: string,
  elementId: string,
  iframeRef: React.RefObject<HTMLIFrameElement>,
  options: UseElementDeletionOptions = {},
) {
  const dispatch = useAppDispatch();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const deleteElement = useCallback(() => {
    const doc = getIframeDoc();
    if (!doc) return false;

    const element = getElementFromIframe(iframeRef.current, elementPath);
    if (!element) return false;

    // Prevent deleting body/html
    if (element === doc.body || element === doc.documentElement) {
      return false;
    }

    // Store element data for undo
    const elementData = {
      element,
      parent: element.parentElement,
      nextSibling: element.nextSibling,
      outerHTML: element.outerHTML,
    };

    // Remove element
    element.remove();

    // Track change
    dispatch(
      trackChange({
        slideId,
        elementId,
        type: "delete",
        data: { deleted: true },
        previousData: elementData,
      }),
    );

    // Clear selection
    dispatch(clearSelection({ slideId }));

    return true;
  }, [slideId, elementId, elementPath, iframeRef, dispatch]);

  const handleDelete = useCallback(() => {
    if (options.requireConfirmation) {
      setShowConfirmDialog(true);
    } else {
      deleteElement();
    }
  }, [options.requireConfirmation, deleteElement]);

  const confirmDelete = useCallback(() => {
    setShowConfirmDialog(false);
    deleteElement();
    options.onDelete?.(elementId);
  }, [deleteElement, elementId, options]);

  return {
    isDeleting,
    showConfirmDialog,
    handleDelete,
    confirmDelete,
    cancelDelete: () => setShowConfirmDialog(false),
  };
}
```

#### 2.1.2 Create Delete Confirmation Dialog (`DeleteConfirmDialog.tsx`)

**Purpose:** User-friendly confirmation before deletion

**Features:**

- Clear warning message
- Element preview/info
- Cancel/Confirm buttons
- Keyboard shortcuts (Enter to confirm, Esc to cancel)

**Implementation:**

```typescript
// components/presentation/editing/DeleteConfirmDialog.tsx

interface DeleteConfirmDialogProps {
  open: boolean;
  elementTag: string;
  elementText: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteConfirmDialog({
  open,
  elementTag,
  elementText,
  onConfirm,
  onCancel,
}: DeleteConfirmDialogProps) {
  // Dialog implementation with AlertDialog component
}
```

#### 2.1.3 Integrate with Toolbar

**Modifications to `EditingToolbar.tsx`:**

- Enable delete button (currently disabled)
- Wire up `useElementDeletion` hook
- Show confirmation dialog
- Handle delete completion

**Tasks:**

- [ ] Import `useElementDeletion` hook
- [ ] Replace disabled delete button with active one
- [ ] Add `DeleteConfirmDialog` component
- [ ] Handle delete callbacks

---

### Task 2: Element Duplication (Day 1-2)

#### 2.2.1 Create Duplication Hook (`useElementDuplication.ts`)

**Purpose:** Clone elements with smart positioning

**Features:**

- Clone element with all attributes and styles
- Generate unique IDs for cloned elements
- Smart offset positioning (10px offset by default)
- Track duplication in Redux
- Support undo operation

**Implementation:**

```typescript
// hooks/presentation/useElementDuplication.ts

interface UseElementDuplicationOptions {
  offsetX?: number; // Default: 10px
  offsetY?: number; // Default: 10px
  selectAfterClone?: boolean; // Default: true
}

export function useElementDuplication(
  slideId: string,
  elementPath: string,
  elementId: string,
  iframeRef: React.RefObject<HTMLIFrameElement>,
  options: UseElementDuplicationOptions = {},
) {
  const dispatch = useAppDispatch();
  const [isDuplicating, setIsDuplicating] = useState(false);

  const duplicateElement = useCallback(() => {
    const doc = getIframeDoc();
    if (!doc) return false;

    const element = getElementFromIframe(iframeRef.current, elementPath);
    if (!element) return false;

    // Clone element
    const cloned = element.cloneNode(true) as HTMLElement;

    // Generate new ID
    const newId = generateId();
    cloned.id = cloned.id ? `${cloned.id}-copy-${newId}` : newId;

    // Remove selection classes
    cloned.classList.remove("element-selected", "element-hovered");

    // Calculate offset position
    const rect = element.getBoundingClientRect();
    const computed = (doc.defaultView || window).getComputedStyle(element);
    const currentLeft = parseFloat(computed.left) || 0;
    const currentTop = parseFloat(computed.top) || 0;

    const offsetX = options.offsetX ?? 10;
    const offsetY = options.offsetY ?? 10;

    // Apply position
    if (computed.position === "static") {
      cloned.style.position = "relative";
      cloned.style.left = `${offsetX}px`;
      cloned.style.top = `${offsetY}px`;
    } else {
      cloned.style.left = `${currentLeft + offsetX}px`;
      cloned.style.top = `${currentTop + offsetY}px`;
    }

    // Insert after original element
    element.parentElement?.insertBefore(cloned, element.nextSibling);

    // Track change
    dispatch(
      trackChange({
        slideId,
        elementId: newId,
        type: "duplicate",
        data: {
          originalElementId: elementId,
          offsetX,
          offsetY,
        },
        previousData: {
          clonedElement: cloned.outerHTML,
        },
      }),
    );

    // Select cloned element if requested
    if (options.selectAfterClone !== false) {
      // Trigger selection of new element
      // This would require updating the selection system
    }

    return true;
  }, [slideId, elementId, elementPath, iframeRef, options, dispatch]);

  return {
    isDuplicating,
    duplicateElement,
  };
}
```

#### 2.2.2 Integrate with Toolbar

**Modifications to `EditingToolbar.tsx`:**

- Enable duplicate button (currently disabled)
- Wire up `useElementDuplication` hook
- Handle duplication completion

**Tasks:**

- [ ] Import `useElementDuplication` hook
- [ ] Replace disabled duplicate button with active one
- [ ] Handle duplicate callbacks

---

### Task 3: Save & Persistence (Day 2-4)

#### 2.3.1 Create Save Service (`slideEditService.ts`)

**Purpose:** Handle API calls for saving slide changes

**Features:**

- Extract modified HTML from iframe
- Send to backend API
- Handle errors and retries
- Optimistic updates
- Conflict detection

**Implementation:**

```typescript
// services/presentation/slideEditService.ts

interface SaveSlideParams {
  slideId: string;
  presentationId: string;
  htmlContent: string;
  metadata?: {
    lastEdited: string;
    editedBy: string;
    version?: number;
  };
}

interface SaveSlideResponse {
  success: boolean;
  slideId: string;
  version: number;
  savedAt: string;
  conflict?: boolean;
}

export class SlideEditService {
  /**
   * Save slide changes to backend
   */
  static async saveSlide(params: SaveSlideParams): Promise<SaveSlideResponse> {
    try {
      // Extract HTML from iframe
      const htmlContent = extractModifiedContent(params.htmlContent);

      // Call API
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SLIDE_API_URL}/slides/${params.slideId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getAuthToken()}`,
          },
          body: JSON.stringify({
            html_content: htmlContent,
            presentation_id: params.presentationId,
            metadata: params.metadata,
          }),
        },
      );

      if (!response.ok) {
        if (response.status === 409) {
          // Conflict detected
          return {
            success: false,
            slideId: params.slideId,
            version: 0,
            savedAt: new Date().toISOString(),
            conflict: true,
          };
        }
        throw new Error(`Save failed: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        success: true,
        slideId: data.slideId,
        version: data.version,
        savedAt: data.savedAt,
      };
    } catch (error) {
      console.error("Save error:", error);
      throw error;
    }
  }

  /**
   * Extract modified content from iframe HTML
   */
  static extractModifiedContent(htmlContent: string): string {
    // Use existing extractModifiedContent from presentationEditScripts.ts
    // This removes editor-specific classes and reconstructs clean HTML
    return htmlContent;
  }
}
```

#### 2.3.2 Create Auto-Save Hook (`useAutoSave.ts`)

**Purpose:** Automatic saving with debouncing

**Features:**

- Debounced auto-save (30s default)
- Track save status (saving, saved, error)
- Handle unsaved changes indicator
- Auto-save on window unload
- Manual save trigger

**Implementation:**

```typescript
// hooks/presentation/useAutoSave.ts

interface UseAutoSaveOptions {
  enabled?: boolean;
  debounceMs?: number; // Default: 30000 (30s)
  onSaveSuccess?: () => void;
  onSaveError?: (error: Error) => void;
}

export function useAutoSave(
  slideId: string,
  presentationId: string,
  iframeRef: React.RefObject<HTMLIFrameElement>,
  options: UseAutoSaveOptions = {},
) {
  const dispatch = useAppDispatch();
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  const saveSlide = useCallback(async () => {
    if (!iframeRef.current) return;

    setSaveStatus("saving");

    try {
      // Extract HTML from iframe
      const htmlContent = extractModifiedContent(
        iframeRef.current.contentDocument?.documentElement.outerHTML || "",
      );

      // Save to backend
      const result = await SlideEditService.saveSlide({
        slideId,
        presentationId,
        htmlContent,
        metadata: {
          lastEdited: new Date().toISOString(),
          editedBy: "user",
        },
      });

      if (result.success) {
        setSaveStatus("saved");
        setLastSavedAt(new Date());
        dispatch(
          markAsSaved({
            slideId,
            savedAt: result.savedAt,
            version: result.version,
          }),
        );
        options.onSaveSuccess?.();
      } else if (result.conflict) {
        setSaveStatus("error");
        // Handle conflict
        handleConflict(result);
      }
    } catch (error) {
      setSaveStatus("error");
      options.onSaveError?.(error as Error);
    }
  }, [slideId, presentationId, iframeRef, dispatch, options]);

  // Debounced auto-save
  const debouncedSave = useDebounce(saveSlide, options.debounceMs ?? 30000);

  // Auto-save on changes
  useEffect(() => {
    if (!options.enabled) return;

    const hasChanges = useSelector(
      (state: RootState) =>
        state.slideEdit.editingSlides[slideId]?.hasUnsavedChanges,
    );

    if (hasChanges) {
      debouncedSave();
    }
  }, [slideId, options.enabled, debouncedSave]);

  // Auto-save on window unload
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const hasChanges = useSelector(
        (state: RootState) =>
          state.slideEdit.editingSlides[slideId]?.hasUnsavedChanges,
      );

      if (hasChanges) {
        e.preventDefault();
        e.returnValue =
          "You have unsaved changes. Are you sure you want to leave?";
        // Trigger immediate save
        saveSlide();
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [slideId, saveSlide]);

  return {
    saveStatus,
    lastSavedAt,
    saveSlide, // Manual save
    isSaving: saveStatus === "saving",
    isSaved: saveStatus === "saved",
    hasError: saveStatus === "error",
  };
}
```

#### 2.3.3 Add Save Status Indicator (`SaveStatusIndicator.tsx`)

**Purpose:** Visual feedback for save status

**Features:**

- Show saving/saved/error states
- Display last saved time
- Manual save button
- Conflict resolution UI

**Implementation:**

```typescript
// components/presentation/editing/SaveStatusIndicator.tsx

interface SaveStatusIndicatorProps {
  saveStatus: "idle" | "saving" | "saved" | "error";
  lastSavedAt: Date | null;
  onManualSave: () => void;
  hasUnsavedChanges: boolean;
}

export function SaveStatusIndicator({
  saveStatus,
  lastSavedAt,
  onManualSave,
  hasUnsavedChanges,
}: SaveStatusIndicatorProps) {
  // Status indicator with icon, text, and manual save button
}
```

#### 2.3.4 Update Redux Slice

**Modifications to `slideEditSlice.ts`:**

- Add `markAsSaved` action
- Add `setSaveStatus` action
- Add `handleConflict` action
- Update `hasUnsavedChanges` flag properly

**Tasks:**

- [ ] Add save-related actions
- [ ] Update `trackChange` to set `hasUnsavedChanges: true`
- [ ] Add conflict resolution state

#### 2.3.5 Add API Endpoint

**Modifications to `presentationApi.js`:**

- Add `saveSlide` mutation
- Handle errors and conflicts
- Add optimistic updates

**Tasks:**

- [ ] Add `saveSlide` mutation endpoint
- [ ] Add error handling
- [ ] Add conflict detection

---

### Task 4: Enhanced Undo/Redo System (Day 4-5)

#### 2.4.1 Enhance Existing Undo/Redo

**Current State:** `useChangeTracking.ts` exists but may need enhancement

**Required Enhancements:**

- Command history limit (max 50 operations)
- History visualization (optional)
- Keyboard shortcuts (already implemented)
- Persist history to localStorage (optional)
- Better performance for large histories

**Implementation:**

```typescript
// hooks/presentation/useUndoRedo.ts (or enhance useChangeTracking.ts)

interface UseUndoRedoOptions {
  maxHistorySize?: number; // Default: 50
  persistToLocalStorage?: boolean; // Default: false
}

export function useUndoRedo(slideId: string, options: UseUndoRedoOptions = {}) {
  const dispatch = useAppDispatch();

  // Use existing Redux state
  const changeHistory = useSelector(
    (state: RootState) =>
      state.slideEdit.editingSlides[slideId]?.changeHistory || [],
  );
  const currentHistoryIndex = useSelector(
    (state: RootState) =>
      state.slideEdit.editingSlides[slideId]?.currentHistoryIndex ?? -1,
  );

  // Limit history size
  useEffect(() => {
    if (changeHistory.length > (options.maxHistorySize ?? 50)) {
      // Remove oldest entries
      dispatch(trimHistory({ slideId, maxSize: options.maxHistorySize ?? 50 }));
    }
  }, [changeHistory.length, slideId, options.maxHistorySize, dispatch]);

  // Persist to localStorage
  useEffect(() => {
    if (options.persistToLocalStorage) {
      localStorage.setItem(
        `slide-edit-history-${slideId}`,
        JSON.stringify({
          history: changeHistory,
          index: currentHistoryIndex,
        }),
      );
    }
  }, [
    changeHistory,
    currentHistoryIndex,
    slideId,
    options.persistToLocalStorage,
  ]);

  const undo = useCallback(() => {
    if (currentHistoryIndex < 0) return false;

    const change = changeHistory[currentHistoryIndex];
    // Revert change based on type
    dispatch(revertChange({ slideId, change }));
    dispatch(undoChange({ slideId }));

    return true;
  }, [slideId, currentHistoryIndex, changeHistory, dispatch]);

  const redo = useCallback(() => {
    if (currentHistoryIndex >= changeHistory.length - 1) return false;

    const nextIndex = currentHistoryIndex + 1;
    const change = changeHistory[nextIndex];
    // Reapply change
    dispatch(reapplyChange({ slideId, change }));
    dispatch(redoChange({ slideId }));

    return true;
  }, [slideId, currentHistoryIndex, changeHistory, dispatch]);

  return {
    undo,
    redo,
    canUndo: currentHistoryIndex >= 0,
    canRedo: currentHistoryIndex < changeHistory.length - 1,
    historyLength: changeHistory.length,
    currentIndex: currentHistoryIndex,
  };
}
```

#### 2.4.2 Add Revert/Reapply Actions to Redux

**Modifications to `slideEditSlice.ts`:**

- Add `revertChange` action
- Add `reapplyChange` action
- Add `trimHistory` action

**Tasks:**

- [ ] Implement revert logic for each change type
- [ ] Implement reapply logic
- [ ] Add history trimming

---

## 3. Integration Points

### 3.1 Toolbar Integration

**File:** `src/components/presentation/editing/EditingToolbar.tsx`

**Changes:**

1. Enable delete button → wire `useElementDeletion`
2. Enable duplicate button → wire `useElementDuplication`
3. Add save status indicator
4. Enhance undo/redo buttons (already exist, may need visual feedback)

### 3.2 SlidePreview Integration

**File:** `src/components/presentation/SlidePreview.jsx`

**Changes:**

1. Add `useAutoSave` hook
2. Display `SaveStatusIndicator`
3. Handle conflict resolution
4. Pass `presentationId` to save service

### 3.3 Redux Integration

**File:** `src/redux/slices/slideEditSlice.ts`

**Changes:**

1. Add save-related actions
2. Add delete/duplicate tracking
3. Enhance change history management
4. Add conflict resolution state

---

## 4. Testing Checklist

### 4.1 Element Deletion

- [ ] Delete element successfully
- [ ] Confirm dialog appears
- [ ] Undo works after deletion
- [ ] Cannot delete body/html
- [ ] Selection clears after deletion

### 4.2 Element Duplication

- [ ] Duplicate element successfully
- [ ] Cloned element has offset position
- [ ] All styles preserved
- [ ] Unique ID generated
- [ ] Undo works after duplication

### 4.3 Save & Persistence

- [ ] Auto-save triggers after 30s
- [ ] Manual save works
- [ ] Save status updates correctly
- [ ] Conflict detection works
- [ ] Optimistic updates work
- [ ] Error handling works

### 4.4 Undo/Redo

- [ ] Undo works for all change types
- [ ] Redo works correctly
- [ ] History limit enforced
- [ ] Keyboard shortcuts work
- [ ] History persists (if enabled)

---

## 5. Performance Considerations

### 5.1 Debouncing

- Auto-save: 30s debounce
- Save status updates: 500ms debounce
- Conflict checking: 1s debounce

### 5.2 Memory Management

- Limit history to 50 operations
- Clear history on slide close
- Use weak references where possible

### 5.3 Network Optimization

- Request deduplication for saves
- Retry logic with exponential backoff
- Optimistic updates

---

## 6. Error Handling

### 6.1 Save Errors

- Network errors: Retry with backoff
- Conflict errors: Show resolution dialog
- Validation errors: Show user-friendly message

### 6.2 Delete Errors

- Prevent deleting critical elements
- Show error if deletion fails
- Maintain undo capability

### 6.3 Duplicate Errors

- Handle ID conflicts
- Validate element can be duplicated
- Show error if duplication fails

---

## 7. Security Considerations

### 7.1 Input Validation

- Validate HTML before saving
- Sanitize element IDs
- Check element permissions

### 7.2 API Security

- Authenticate save requests
- Validate slide ownership
- Rate limit save requests

---

## 8. Deliverables

1. ✅ Element deletion with undo support
2. ✅ Element duplication with smart positioning
3. ✅ Auto-save functionality (30s debounce)
4. ✅ Manual save with status indicator
5. ✅ Conflict resolution
6. ✅ Enhanced undo/redo system
7. ✅ Error handling and recovery
8. ✅ Integration with existing toolbar

---

## 9. Success Criteria

- [ ] All features work without errors
- [ ] Auto-save saves changes every 30s
- [ ] Manual save works instantly
- [ ] Undo/redo works for all operations
- [ ] Conflict resolution works
- [ ] Performance is acceptable (<100ms for operations)
- [ ] Error handling is user-friendly
- [ ] Code follows project standards

---

## 10. Next Steps After Phase 5

Once Phase 5 is complete, proceed to **Phase 6: Polish & Optimization**:

- Error handling improvements
- Performance optimization
- Testing (unit, integration, E2E)
- Documentation

---

**Document Version:** 1.0  
**Last Updated:** Current Session  
**Status:** Ready for Implementation
