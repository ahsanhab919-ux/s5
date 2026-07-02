# Slide Editing Architecture Documentation

This document explains how the slide editing system works in simple, clear terms. It's designed for developers who need to understand, maintain, or extend the editing features.

---

## Table of Contents

1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [File Structure](#file-structure)
4. [Data Flow](#data-flow)
5. [Key Components](#key-components)
6. [How Things Work Together](#how-things-work-together)
7. [Iframe Communication](#iframe-communication)
8. [State Management](#state-management)
9. [Common Patterns](#common-patterns)

---

## Overview

### What is This System?

The slide editing system allows users to edit presentation slides directly in the browser. Users can:

- Click on elements to select them
- Edit text inline
- Move and resize elements
- Delete or duplicate elements
- Undo and redo changes
- Save changes automatically

### Key Design Principles

1. **Separation of Concerns**: UI components, business logic, and state management are kept separate
2. **Iframe Isolation**: Slides are rendered in iframes to prevent style conflicts
3. **Redux for State**: Centralized state management for editing operations
4. **Custom Hooks**: Reusable logic organized into hooks
5. **Error Handling**: Error boundaries catch and handle errors gracefully

---

## System Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────┐
│                    User Interface                        │
│  (SlidePreview.jsx - Main Component)                    │
└─────────────────┬───────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│                 Editing Components                      │
│  - EditingToolbar    - ResizeHandles                    │
│  - GridOverlay       - AlignmentGuides                 │
└─────────────────┬───────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│                  Custom Hooks Layer                     │
│  - useSlideEditor      - useTextEditing                │
│  - useChangeTracking   - useDragAndDrop                │
│  - useAutoSave         - useElementDeletion            │
└─────────────────┬───────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│                   Redux Store                           │
│  - slideEditSlice (editing state)                     │
│  - presentationSlice (slide data)                     │
└─────────────────┬───────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│              Iframe (Slide Content)                     │
│  - Injected scripts for selection                       │
│  - PostMessage communication                           │
└─────────────────────────────────────────────────────────┘
```

### Three Main Layers

1. **UI Layer** (Components)
   - What users see and interact with
   - React components that render the interface

2. **Logic Layer** (Hooks)
   - Business logic and operations
   - Custom hooks that handle editing functionality

3. **Data Layer** (Redux)
   - Centralized state storage
   - Tracks changes, selections, and history

---

## File Structure

### Directory Organization

```
src/
├── components/presentation/
│   ├── SlidePreview.jsx              # Main preview component
│   └── editing/
│       ├── EditingToolbar.tsx         # Toolbar with edit controls
│       ├── ResizeHandles.tsx         # Resize handles for elements
│       ├── GridOverlay.tsx           # Grid overlay for alignment
│       ├── AlignmentGuides.tsx       # Visual guides during drag
│       ├── EditingErrorBoundary.tsx  # Error handling wrapper
│       └── *Skeleton.tsx             # Loading placeholders
│
├── hooks/presentation/
│   ├── useSlideEditor.ts             # Main orchestrator hook
│   ├── useChangeTracking.ts          # Undo/redo functionality
│   ├── useTextEditing.ts             # Text editing logic
│   ├── useDragAndDrop.ts             # Drag and drop operations
│   ├── useElementDeletion.ts         # Delete element logic
│   ├── useElementDuplication.ts      # Duplicate element logic
│   ├── useAutoSave.ts                # Auto-save functionality
│   ├── useKeyboardNavigation.ts      # Arrow key movement
│   └── useLayerOrdering.ts           # Z-index management
│
├── redux/slices/
│   ├── slideEditSlice.ts             # Editing state management
│   └── presentationSlice.js           # Presentation data
│
├── lib/
│   └── presentationEditScripts.ts    # Iframe scripts injection
│
└── services/presentation/
    └── slideEditService.ts            # API calls for saving
```

### File Purposes

**Components:**

- `SlidePreview.jsx` - Main container that displays slides and manages edit mode
- `EditingToolbar.tsx` - Floating toolbar with edit buttons (undo, delete, etc.)
- `ResizeHandles.tsx` - Visual handles for resizing selected elements
- `GridOverlay.tsx` - Optional grid overlay for alignment
- `AlignmentGuides.tsx` - Visual lines that appear when dragging elements

**Hooks:**

- `useSlideEditor.ts` - Coordinates editing operations, manages edit mode
- `useChangeTracking.ts` - Handles undo/redo history and change tracking
- `useTextEditing.ts` - Manages inline text editing
- `useDragAndDrop.ts` - Handles dragging elements around the slide
- `useAutoSave.ts` - Automatically saves changes every 30 seconds

**Redux:**

- `slideEditSlice.ts` - Stores editing state, change history, selected elements

---

## Data Flow

### How Data Moves Through the System

#### 1. User Clicks an Element

```
User clicks element in iframe
    ↓
Iframe script detects click
    ↓
PostMessage sent to parent window
    ↓
useSlideEditor hook receives message
    ↓
Redux action dispatched (setSelectedElement)
    ↓
Component re-renders with selected element
    ↓
EditingToolbar appears
```

#### 2. User Edits Text

```
User types in selected element
    ↓
useTextEditing hook detects change
    ↓
Debounced update (300ms delay)
    ↓
Redux action dispatched (trackChange)
    ↓
Change added to history
    ↓
Element updated in iframe DOM
    ↓
Auto-save triggered (after 30s)
```

#### 3. User Undoes a Change

```
User clicks undo button
    ↓
useChangeTracking hook called
    ↓
Finds last change in history
    ↓
Reverts DOM to previous state
    ↓
Redux action dispatched (undo)
    ↓
History index decremented
    ↓
Component re-renders
```

### Complete Flow Example: Editing Text

1. **Selection Phase**
   - User clicks element → iframe script fires → postMessage sent
   - `useSlideEditor` receives message → Redux stores selection
   - `EditingToolbar` appears with edit options

2. **Editing Phase**
   - User clicks text edit button → `useTextEditing` activates
   - Element becomes `contentEditable` → user types
   - Changes debounced → Redux tracks change → history updated

3. **Saving Phase**
   - After 30 seconds → `useAutoSave` triggers
   - HTML extracted from iframe → API called
   - Save status updated → user sees success message

---

## Key Components

### SlidePreview.jsx

**Purpose:** Main container that displays slides and manages edit mode

**Key Responsibilities:**

- Renders the iframe with slide content
- Manages edit mode toggle
- Coordinates all editing components
- Handles auto-save integration

**Key Props:**

- `slide` - Slide data (HTML content)
- `index` - Slide index
- `presentationId` - Presentation ID for saving

**Key State:**

- `isEditMode` - Whether editing is active
- `selectedElement` - Currently selected element data
- `gridEnabled` - Whether grid overlay is shown

### EditingToolbar.tsx

**Purpose:** Floating toolbar with editing controls

**Features:**

- Undo/Redo buttons
- Delete/Duplicate buttons
- Layer ordering (bring forward/send backward)
- Grid toggle
- Text edit button

**Location:** Positioned absolutely in top-right of slide preview

### useSlideEditor.ts

**Purpose:** Main orchestrator hook that coordinates editing

**What it does:**

- Manages edit mode on/off
- Handles element selection from iframe
- Coordinates between different editing operations
- Communicates with iframe via postMessage

**Returns:**

```typescript
{
  isEditing: boolean;
  selectedElement: ElementData | null;
  startEditMode: () => void;
  stopEditMode: () => void;
  selectElement: (element: ElementData) => void;
}
```

### useChangeTracking.ts

**Purpose:** Manages undo/redo history

**What it does:**

- Tracks all changes made during editing
- Stores previous state for each change
- Provides undo/redo functions
- Limits history to 50 operations

**How it works:**

- Each change is stored with `data` (new state) and `previousData` (old state)
- Undo: Restores `previousData` to DOM
- Redo: Reapplies `data` to DOM

### useAutoSave.ts

**Purpose:** Automatically saves changes periodically

**Configuration:**

- Debounce: 30 seconds (waits 30s after last change)
- Only saves when in edit mode
- Shows save status indicator

**Flow:**

1. User makes changes
2. Changes tracked in Redux
3. 30 seconds pass without new changes
4. Auto-save triggers
5. HTML extracted from iframe
6. API call made
7. Status updated

---

## How Things Work Together

### Edit Mode Activation

```
1. User clicks "Edit" button in SlidePreview
   ↓
2. SlidePreview calls startEditMode() from useSlideEditor
   ↓
3. useSlideEditor dispatches startEditing Redux action
   ↓
4. useSlideEditor sends postMessage to iframe: TOGGLE_EDIT_MODE
   ↓
5. Iframe script enables selection mode
   ↓
6. User can now click elements to select them
```

### Element Selection

```
1. User clicks element in iframe
   ↓
2. Iframe script (handleElementClick) fires
   ↓
3. Script generates element data (path, styles, position)
   ↓
4. Script sends postMessage: ELEMENT_SELECTED
   ↓
5. useSlideEditor receives message in useEffect
   ↓
6. Redux action dispatched: setSelectedElement
   ↓
7. EditingToolbar and ResizeHandles appear
```

### Text Editing

```
1. User selects element and clicks text edit button
   ↓
2. EditingToolbar calls useTextEditing.startEditing()
   ↓
3. Element becomes contentEditable in iframe
   ↓
4. User types → useTextEditing.handleChange() called
   ↓
5. Change debounced (300ms)
   ↓
6. After debounce → Redux trackChange action
   ↓
7. Change added to history
   ↓
8. User clicks away → contentEditable disabled
```

### Drag and Drop

```
1. User clicks and drags selected element
   ↓
2. useDragAndDrop detects drag start
   ↓
3. Element position tracked during drag
   ↓
4. AlignmentGuides calculates and displays guides
   ↓
5. User releases mouse → drag ends
   ↓
6. Final position calculated
   ↓
7. Element moved in iframe DOM
   ↓
8. Redux trackChange action (position change)
```

---

## Iframe Communication

### Why Iframes?

Slides are rendered in iframes to:

- Isolate styles (prevent conflicts with main app)
- Provide a clean editing environment
- Allow safe content editing

### Communication Pattern

The system uses **postMessage** to communicate between the main app and iframe:

**Parent → Iframe Messages:**

```typescript
// Enable/disable edit mode
{
  type: "TOGGLE_EDIT_MODE",
  enabled: true
}

// Programmatically select element
{
  type: "SELECT_ELEMENT",
  elementPath: "div#my-element"
}
```

**Iframe → Parent Messages:**

```typescript
// Element selected by user
{
  type: "ELEMENT_SELECTED",
  data: {
    elementPath: "div#my-element",
    boundingRect: { top, left, width, height },
    computedStyles: { ... },
    textContent: "Hello",
    ...
  }
}
```

### Iframe Scripts

Scripts are injected into the iframe via `createEnhancedIframeContentFromHTML()`:

**Key Scripts:**

1. **Selection Handler** - Detects clicks and sends selection data
2. **Hover Handler** - Shows visual feedback on hover
3. **Edit Mode Toggle** - Enables/disables selection mode
4. **Path Generator** - Creates reliable CSS selectors for elements

**Location:** `src/lib/presentationEditScripts.ts`

---

## State Management

### Redux Structure

The editing state is stored in `slideEditSlice.ts`:

```typescript
{
  editingSlides: {
    "slide-1": {
      isEditing: true,
      hasUnsavedChanges: true,
      lastSavedAt: "2024-01-15T10:30:00Z",
      changeHistory: [/* array of changes */],
      currentHistoryIndex: 5
    }
  },
  activeOperations: {
    "slide-1": {
      selectedElement: { /* element data */ },
      editingMode: "text" | "style" | "position" | null
    }
  }
}
```

### Key Redux Actions

**Editing Control:**

- `startEditing` - Enable edit mode
- `stopEditing` - Disable edit mode

**Selection:**

- `setSelectedElement` - Set currently selected element
- `setEditingMode` - Set current editing mode (text/style/position)

**Change Tracking:**

- `trackChange` - Record a change in history
- `undo` - Undo last change
- `redo` - Redo last undone change

**Saving:**

- `setSaving` - Mark as saving
- `setSaved` - Mark as saved
- `setSaveError` - Mark save error

### Selectors

Selectors are used to efficiently access Redux state:

```typescript
// Get editing state for a slide
selectEditingSlide(slideId);

// Get selected element
selectActiveOperation(slideId).selectedElement;

// Check if undo is available
selectCanUndo(slideId);

// Get change history
selectChangeHistory(slideId);
```

---

## Common Patterns

### Pattern 1: Debouncing

**Why:** Prevents too many updates when user is typing or dragging

**Example:**

```typescript
// Text editing: Wait 300ms after user stops typing
const debouncedUpdate = useDebounce(updateText, 300);

// Auto-save: Wait 30 seconds after last change
const debouncedSave = useDebounce(saveChanges, 30000);
```

### Pattern 2: Error Boundaries

**Why:** Prevents entire app from crashing if editing component fails

**Usage:**

```tsx
<EditingErrorBoundary
  context={{ slideId, componentName: "EditingToolbar" }}
>
  <EditingToolbar ... />
</EditingErrorBoundary>
```

### Pattern 3: Lazy Loading

**Why:** Reduces initial bundle size, loads components only when needed

**Implementation:**

```tsx
const EditingToolbar = dynamic(() => import("./editing/EditingToolbar"), {
  ssr: false,
});
```

### Pattern 4: Memoization

**Why:** Prevents unnecessary re-renders

**Usage:**

```tsx
export const EditingToolbar = memo(function EditingToolbar({ ... }) {
  // Component code
});
```

### Pattern 5: Multiple Fallback Strategies

**Why:** Elements might not be found by first method (e.g., after duplication)

**Example (from useChangeTracking):**

```typescript
// Strategy 1: Try elementPath
// Strategy 2: Try elementId
// Strategy 3: Try selected class
// Strategy 4: Try traversing DOM
```

---

## Additional Resources

### Related Documentation

- [Developer Guide](./DEVELOPER_GUIDE.md) - How to add new features
- [Implementation Plan](../EDITING_FEATURES_IMPLEMENTATION_PLAN.md) - Original plan
- [Phase 6 Status](../PHASE6_STATUS_REVIEW.md) - Current status

### Key Files to Understand

1. **Start here:** `SlidePreview.jsx` - Main component
2. **Then:** `useSlideEditor.ts` - Main hook
3. **Then:** `slideEditSlice.ts` - State management
4. **Then:** `presentationEditScripts.ts` - Iframe scripts

### Common Questions

**Q: Why use iframes?**  
A: To isolate styles and provide a safe editing environment.

**Q: How does undo/redo work?**  
A: Each change stores both new and old state. Undo restores old state, redo reapplies new state.

**Q: How does auto-save work?**  
A: After 30 seconds of no changes, HTML is extracted from iframe and sent to API.

**Q: How are elements selected?**  
A: Iframe script detects clicks, generates element data, and sends postMessage to parent.

**Q: How are changes tracked?**  
A: All changes are stored in Redux with previous state for undo support.

---

**Last Updated:** Current Session  
**Maintained By:** Engineering Team
