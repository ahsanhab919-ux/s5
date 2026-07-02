# Developer Guide - Slide Editing Features

This guide shows you how to extend the slide editing system with new features. It provides step-by-step instructions with examples.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Adding a New Editing Feature](#adding-a-new-editing-feature)
3. [Adding a New Change Type](#adding-a-new-change-type)
4. [Extending Undo/Redo](#extending-undoredo)
5. [Adding a New Hook](#adding-a-new-hook)
6. [Adding a New Component](#adding-a-new-component)
7. [Common Patterns](#common-patterns)
8. [Troubleshooting](#troubleshooting)

---

## Getting Started

### Prerequisites

- Understand React hooks
- Understand Redux basics
- Familiar with TypeScript (optional but recommended)

### Key Concepts to Understand

1. **Hooks** - Business logic lives in custom hooks
2. **Redux** - State management in `slideEditSlice.ts`
3. **Iframe Communication** - PostMessage for parent ↔ iframe communication
4. **Change Tracking** - All changes tracked for undo/redo

---

## Adding a New Editing Feature

### Example: Adding "Rotate Element" Feature

Let's say you want to add rotation functionality. Here's how:

#### Step 1: Create the Hook

Create `src/hooks/presentation/useElementRotation.ts`:

```typescript
import { getElementFromIframe } from "@/lib/presentation/editing/editorUtils";
import { useAppDispatch } from "@/redux/hooks";
import { trackChange } from "@/redux/slices/slideEditSlice";
import { useCallback } from "react";

export function useElementRotation(
  slideId: string,
  elementPath: string,
  elementId: string,
  iframeRef: React.RefObject<HTMLIFrameElement>,
) {
  const dispatch = useAppDispatch();

  const rotateElement = useCallback(
    (degrees: number) => {
      const doc =
        iframeRef.current?.contentDocument ||
        iframeRef.current?.contentWindow?.document;
      if (!doc) return;

      // Find element
      const element = getElementFromIframe(doc, elementPath, elementId);
      if (!element) {
        console.error("Element not found for rotation");
        return;
      }

      // Get current rotation
      const currentTransform = element.style.transform || "";
      const currentRotation = extractRotation(currentTransform) || 0;

      // Store previous state for undo
      const previousData = {
        transform: element.style.transform || "",
        rotation: currentRotation,
      };

      // Apply new rotation
      const newRotation = currentRotation + degrees;
      const newTransform = updateTransform(currentTransform, newRotation);
      element.style.transform = newTransform;

      // Track change for undo/redo
      dispatch(
        trackChange({
          slideId,
          elementId,
          type: "style", // Use existing type or add new one
          data: {
            transform: newTransform,
            rotation: newRotation,
          },
          previousData,
        }),
      );
    },
    [slideId, elementPath, elementId, iframeRef, dispatch],
  );

  return { rotateElement };
}

// Helper functions
function extractRotation(transform: string): number | null {
  const match = transform.match(/rotate\(([^)]+)deg\)/);
  return match ? parseFloat(match[1]) : null;
}

function updateTransform(transform: string, rotation: number): string {
  // Remove existing rotate, add new one
  const withoutRotate = transform.replace(/rotate\([^)]+\)/g, "");
  return `${withoutRotate} rotate(${rotation}deg)`.trim();
}
```

#### Step 2: Add Button to Toolbar

Edit `src/components/presentation/editing/EditingToolbar.tsx`:

```typescript
import { useElementRotation } from "@/hooks/presentation/useElementRotation";

// Inside the component:
const { rotateElement } = useElementRotation(
  slideId,
  selectedElement?.elementPath || "",
  selectedElement?.id || "",
  iframeRef,
);

// In the toolbar JSX, add button:
<Button
  onClick={() => rotateElement(90)}
  variant="ghost"
  size="icon"
  title="Rotate 90°"
>
  <RotateCw className="h-4 w-4" />
</Button>
```

#### Step 3: Test It

1. Select an element
2. Click rotate button
3. Element should rotate
4. Try undo/redo - should work automatically!

---

## Adding a New Change Type

### When to Add a New Change Type

Add a new type if your feature doesn't fit existing types:

- `text` - Text content changes
- `style` - CSS style changes
- `position` - Position changes
- `delete` - Element deletion
- `duplicate` - Element duplication

### Example: Adding "rotate" Change Type

#### Step 1: Update TypeScript Types

Edit `src/redux/slices/slideEditSlice.ts`:

```typescript
// Update the Change type
export interface Change {
  id: string;
  slideId: string;
  elementId: string;
  type: "text" | "style" | "position" | "delete" | "duplicate" | "rotate"; // Add "rotate"
  timestamp: string;
  data: Record<string, unknown>;
  previousData?: Record<string, unknown>;
}
```

#### Step 2: Update Undo/Redo Logic

Edit `src/hooks/presentation/useChangeTracking.ts`:

Find the `revertChange` function and add rotation handling:

```typescript
// In revertChange function, add:
case "rotate":
  element.style.transform = change.previousData?.transform || "";
  break;
```

Find the `reapplyChange` function and add:

```typescript
// In reapplyChange function, add:
case "rotate":
  element.style.transform = change.data.transform as string;
  break;
```

#### Step 3: Use New Type in Hook

Update your rotation hook to use the new type:

```typescript
dispatch(
  trackChange({
    slideId,
    elementId,
    type: "rotate", // Use new type
    data: {
      transform: newTransform,
      rotation: newRotation,
    },
    previousData,
  }),
);
```

---

## Extending Undo/Redo

### How Undo/Redo Works

1. Each change stores both `data` (new state) and `previousData` (old state)
2. Undo: Restores `previousData` to DOM
3. Redo: Reapplies `data` to DOM

### Example: Making Rotation Undoable

The rotation feature above already works with undo/redo because:

1. It stores `previousData` (old transform)
2. It stores `data` (new transform)
3. `useChangeTracking` handles revert/reapply

### Custom Revert Logic

If you need custom logic, edit `useChangeTracking.ts`:

```typescript
// In revertChange function
case "your-custom-type":
  // Custom revert logic
  if (change.previousData?.customProperty) {
    element.setAttribute("custom-attr", change.previousData.customProperty);
  }
  break;
```

---

## Adding a New Hook

### Hook Structure Template

```typescript
import { useAppDispatch } from "@/redux/hooks";
import { trackChange } from "@/redux/slices/slideEditSlice";
import { useCallback } from "react";

/**
 * Hook description
 *
 * @param slideId - Slide identifier
 * @param elementPath - CSS selector path
 * @param elementId - Element ID
 * @param iframeRef - Iframe reference
 * @returns Hook return value description
 */
export function useYourNewHook(
  slideId: string,
  elementPath: string,
  elementId: string,
  iframeRef: React.RefObject<HTMLIFrameElement>,
) {
  const dispatch = useAppDispatch();

  const doSomething = useCallback(() => {
    // Get iframe document
    const doc =
      iframeRef.current?.contentDocument ||
      iframeRef.current?.contentWindow?.document;
    if (!doc) return;

    // Find element
    const element = doc.querySelector(elementPath);
    if (!element) return;

    // Store previous state
    const previousData = {
      // Capture current state
    };

    // Make changes
    // ... your logic here

    // Track change
    dispatch(
      trackChange({
        slideId,
        elementId,
        type: "your-type",
        data: {
          // New state
        },
        previousData,
      }),
    );
  }, [slideId, elementPath, elementId, iframeRef, dispatch]);

  return { doSomething };
}
```

### Key Points

1. **Always use `useCallback`** - Prevents unnecessary re-renders
2. **Store previous state** - Required for undo/redo
3. **Track changes** - Call `trackChange` Redux action
4. **Handle errors** - Check if element exists
5. **Get iframe document** - Use the pattern shown above

---

## Adding a New Component

### Component Structure Template

````typescript
"use client";

import { memo } from "react";

/**
 * Props interface
 */
interface YourComponentProps {
  slideId: string;
  selectedElement: ElementData | null;
  iframeRef: React.RefObject<HTMLIFrameElement>;
}

/**
 * Component description
 *
 * @example
 * ```tsx
 * <YourComponent
 *   slideId="slide-1"
 *   selectedElement={selectedElement}
 *   iframeRef={iframeRef}
 * />
 * ```
 */
export const YourComponent = memo(function YourComponent({
  slideId,
  selectedElement,
  iframeRef,
}: YourComponentProps) {
  // Component logic here

  return (
    <div>
      {/* Component JSX */}
    </div>
  );
});
````

### Key Points

1. **Use `memo`** - Prevents unnecessary re-renders
2. **Add JSDoc** - Document props and usage
3. **Wrap with Error Boundary** - In `SlidePreview.jsx`
4. **Lazy load if heavy** - Use `next/dynamic` for code splitting

### Adding to SlidePreview

```typescript
// Lazy load
const YourComponent = dynamic(
  () => import("./editing/YourComponent"),
  { ssr: false }
);

// Wrap with error boundary
{isEditMode && selectedElement && (
  <EditingErrorBoundary
    context={{
      slideId,
      componentName: "YourComponent",
    }}
  >
    <YourComponent
      slideId={slideId}
      selectedElement={selectedElement}
      iframeRef={iframeRef}
    />
  </EditingErrorBoundary>
)}
```

---

## Common Patterns

### Pattern 1: Finding Elements in Iframe

```typescript
const getIframeDoc = useCallback(() => {
  return (
    iframeRef.current?.contentDocument ||
    iframeRef.current?.contentWindow?.document ||
    null
  );
}, [iframeRef]);

const findElement = useCallback(() => {
  const doc = getIframeDoc();
  if (!doc) return null;

  // Strategy 1: Try elementPath
  if (elementPath) {
    const element = doc.querySelector(elementPath);
    if (element) return element;
  }

  // Strategy 2: Try elementId
  if (elementId) {
    const element = doc.getElementById(elementId);
    if (element) return element;
  }

  return null;
}, [elementPath, elementId, getIframeDoc]);
```

### Pattern 2: Storing Previous State

```typescript
// Always capture current state before making changes
const previousData = {
  innerHTML: element.innerHTML,
  style: {
    transform: element.style.transform,
    left: element.style.left,
    top: element.style.top,
  },
  attributes: {
    // Capture important attributes
  },
};
```

### Pattern 3: Debouncing Updates

```typescript
import { useDebounce } from "@/hooks/useDebounce"; // Or your debounce utility

const debouncedUpdate = useDebounce((newValue: string) => {
  // Update logic
}, 300); // 300ms delay

// In your handler:
const handleChange = (newValue: string) => {
  debouncedUpdate(newValue);
};
```

### Pattern 4: Error Handling

```typescript
const doOperation = useCallback(
  () => {
    try {
      const doc = getIframeDoc();
      if (!doc) {
        console.error("Cannot access iframe document");
        return;
      }

      const element = findElement();
      if (!element) {
        console.error("Element not found");
        return;
      }

      // Your operation here
    } catch (error) {
      console.error("Operation failed:", error);
      // Show user-friendly error message
    }
  },
  [
    /* dependencies */
  ],
);
```

---

## Troubleshooting

### Problem: Element Not Found After Duplication

**Solution:** Use multiple fallback strategies (see Pattern 1)

**Why:** After duplication, element paths might change. Always try:

1. Element path
2. Element ID
3. Selected class
4. DOM traversal

### Problem: Undo/Redo Not Working

**Check:**

1. Are you calling `trackChange` with `previousData`?
2. Is your change type handled in `revertChange` and `reapplyChange`?
3. Are you storing both old and new state?

**Example Fix:**

```typescript
// ❌ Wrong - missing previousData
dispatch(
  trackChange({
    slideId,
    elementId,
    type: "style",
    data: { color: "red" },
  }),
);

// ✅ Correct - includes previousData
dispatch(
  trackChange({
    slideId,
    elementId,
    type: "style",
    data: { color: "red" },
    previousData: { color: "blue" }, // Required!
  }),
);
```

### Problem: Changes Not Persisting

**Check:**

1. Is auto-save enabled?
2. Is `hasUnsavedChanges` set to `true` in Redux?
3. Is the save API call successful?

**Debug:**

```typescript
// Check Redux state
const editingSlide = useAppSelector(selectEditingSlide(slideId));
console.log("Has unsaved changes:", editingSlide?.hasUnsavedChanges);
console.log("Last saved:", editingSlide?.lastSavedAt);
```

### Problem: Iframe Communication Not Working

**Check:**

1. Is postMessage being sent correctly?
2. Is the listener set up in `useSlideEditor`?
3. Are message types matching?

**Debug:**

```typescript
// In iframe script
window.parent.postMessage(
  {
    type: "ELEMENT_SELECTED",
    data: {
      /* your data */
    },
  },
  "*",
);

// In parent (useSlideEditor)
useEffect(() => {
  const handleMessage = (event: MessageEvent) => {
    if (event.data.type === "ELEMENT_SELECTED") {
      console.log("Received:", event.data);
      // Handle message
    }
  };
  window.addEventListener("message", handleMessage);
  return () => window.removeEventListener("message", handleMessage);
}, []);
```

### Problem: Component Not Updating

**Check:**

1. Is Redux state updating?
2. Are selectors memoized?
3. Is component wrapped with `memo`?

**Debug:**

```typescript
// Add logging in component
useEffect(() => {
  console.log("Selected element changed:", selectedElement);
}, [selectedElement]);
```

---

## Code Style Guidelines

### Naming Conventions

- **Hooks:** `use` prefix (e.g., `useElementRotation`)
- **Components:** PascalCase (e.g., `EditingToolbar`)
- **Functions:** camelCase (e.g., `rotateElement`)
- **Types:** PascalCase with descriptive names (e.g., `ElementData`)

### File Organization

```
src/
├── hooks/presentation/
│   └── useYourFeature.ts      # Business logic
├── components/presentation/editing/
│   └── YourComponent.tsx      # UI component
└── redux/slices/
    └── slideEditSlice.ts      # State management (if needed)
```

### Documentation

Always add JSDoc comments:

````typescript
/**
 * Brief description
 *
 * Longer description explaining what it does and why.
 *
 * @param paramName - Parameter description
 * @returns Return value description
 *
 * @example
 * ```tsx
 * const { doSomething } = useYourHook(...);
 * doSomething();
 * ```
 */
````

### Error Handling

Always handle errors gracefully:

```typescript
try {
  // Your operation
} catch (error) {
  console.error("Operation failed:", error);
  // Optionally show user notification
  showErrorSnackbar("Operation failed. Please try again.");
}
```

---

## Testing Your Changes

### Manual Testing Checklist

- [ ] Feature works as expected
- [ ] Undo/redo works correctly
- [ ] Error handling works (test with invalid inputs)
- [ ] No console errors
- [ ] Component re-renders correctly
- [ ] Auto-save triggers after changes
- [ ] Changes persist after page refresh

### Testing Undo/Redo

1. Make a change
2. Click undo - should revert
3. Click redo - should reapply
4. Make multiple changes
5. Undo multiple times - should work correctly

### Testing Error Cases

1. Delete element, then try to edit it
2. Try to edit non-existent element
3. Try to edit while iframe is loading
4. Test with slow network (auto-save)

---

## Next Steps

### After Adding a Feature

1. **Update Documentation**
   - Add to ARCHITECTURE.md if architecture changes
   - Update this guide if pattern is reusable

2. **Add Tests** (if applicable)
   - Unit tests for hooks
   - Integration tests for components

3. **Code Review**
   - Follow naming conventions
   - Check error handling
   - Verify undo/redo works

---

## Getting Help

### Resources

- [Architecture Documentation](./ARCHITECTURE.md) - System overview
- [Redux Documentation](https://redux.js.org/) - State management
- [React Hooks Guide](https://react.dev/reference/react) - Hooks reference

### Common Questions

**Q: Where should I add my feature?**  
A: Create a hook in `hooks/presentation/`, add UI in `components/presentation/editing/`

**Q: How do I access the iframe?**  
A: Use `iframeRef.current?.contentDocument` or `iframeRef.current?.contentWindow?.document`

**Q: How do I communicate with iframe?**  
A: Use `postMessage` - see iframe communication section in ARCHITECTURE.md

**Q: How do I make changes undoable?**  
A: Store `previousData` when calling `trackChange`, update `useChangeTracking` to handle your type

---

**Last Updated:** Current Session  
**Maintained By:** Engineering Team
