# Slide Editing Features - Production Implementation Plan

## Executive Summary

This document outlines the architecture, implementation strategy, and best practices for building slide editing features in a production-grade web application handling millions of users. The plan prioritizes performance, maintainability, scalability, and code quality.

---

## 1. Architecture Overview

### 1.1 Core Principles

1. **Single Responsibility Principle (SRP)**
   - Each module/class has one reason to change
   - Clear separation between editing logic, state management, and UI

2. **Separation of Concerns**
   - **Presentation Layer**: React components (UI only)
   - **Business Logic Layer**: Custom hooks and services
   - **State Management Layer**: Redux slices + local state
   - **Communication Layer**: PostMessage handlers, iframe communication
   - **Data Layer**: HTML parsing, content extraction

3. **Performance First**
   - Debouncing for frequent operations
   - Memoization for expensive computations
   - Lazy loading for editing tools
   - Virtualization for large slide lists
   - Request deduplication

4. **Maintainability**
   - TypeScript for type safety
   - Clear file structure and naming conventions
   - Comprehensive error handling
   - Logging and monitoring hooks

---

## 2. File Structure

```
src/
├── components/
│   └── presentation/
│       ├── SlidePreview.jsx              # Main preview component (presentation)
│       ├── editing/                      # NEW: Editing components
│       │   ├── EditModeProvider.tsx      # Context for edit mode state
│       │   ├── EditingToolbar.tsx        # Toolbar with editing controls
│       │   ├── StyleEditor.tsx           # Style editing panel
│       │   ├── TextEditor.tsx            # Text editing overlay
│       │   ├── ElementInspector.tsx     # Element property inspector
│       │   └── DragHandles.tsx           # Drag handles for positioning
│       └── ...
├── hooks/
│   └── presentation/
│       ├── useSlideEditor.ts             # NEW: Main editing hook
│       ├── useElementSelection.ts        # NEW: Element selection logic
│       ├── useTextEditing.ts             # NEW: Text editing logic
│       ├── useStyleEditing.ts            # NEW: Style editing logic
│       ├── useDragAndDrop.ts             # NEW: Drag & drop logic
│       ├── useUndoRedo.ts                # NEW: Undo/redo functionality
│       └── useChangeTracking.ts          # NEW: Change tracking
├── lib/
│   └── presentation/
│       ├── presentationEditScripts.ts    # Existing: iframe scripts
│       ├── editing/
│       │   ├── editorCommands.ts         # NEW: Command pattern for edits
│       │   ├── editorUtils.ts            # NEW: Utility functions
│       │   ├── changeTracker.ts          # NEW: Change tracking
│       │   └── validation.ts            # NEW: HTML validation
│       └── ...
├── redux/
│   └── slices/
│       └── presentationSlice.js           # Existing: Add edit state
│       └── slideEditSlice.ts             # NEW: Dedicated edit state slice
└── services/
    └── presentation/
        └── slideEditService.ts            # NEW: API calls for saving
```

---

## 3. State Management Strategy

### 3.1 Redux State (Global)

**New Slice: `slideEditSlice.ts`**

```typescript
interface SlideEditState {
  // Per-slide editing state
  editingSlides: {
    [slideId: string]: {
      isEditing: boolean;
      hasUnsavedChanges: boolean;
      lastSavedAt: string | null;
      changeHistory: Change[];
      currentHistoryIndex: number;
    };
  };

  // Active editing operations
  activeOperations: {
    [slideId: string]: {
      selectedElement: ElementData | null;
      editingMode: "text" | "style" | "position" | null;
    };
  };

  // Performance metrics
  performance: {
    operationCount: number;
    averageOperationTime: number;
  };
}
```

**Why Redux?**

- Shared state across multiple slides
- Undo/redo history across components
- Persist edit state on navigation
- Analytics and monitoring

### 3.2 Local State (Component-Specific)

**Use React useState for:**

- UI state (modals, tooltips, dropdowns)
- Temporary selection state
- Form inputs
- Debounced values

**Use useRef for:**

- Iframe references
- Timer references
- Mutable values that don't trigger re-renders

---

## 4. Implementation Phases

### Phase 1: Foundation & Infrastructure (Week 1)

#### 4.1.1 Create Editor State Management

- [ ] Create `slideEditSlice.ts` with initial state structure
- [ ] Add reducers: `startEditing`, `stopEditing`, `trackChange`
- [ ] Add selectors for optimized state access
- [ ] Add middleware for change tracking

#### 4.1.2 Create Core Hooks

- [ ] `useSlideEditor.ts` - Main orchestrator hook
- [ ] `useElementSelection.ts` - Element selection logic
- [ ] `useChangeTracking.ts` - Change history management
- [ ] Add error boundaries for editing components

#### 4.1.3 Command Pattern Implementation

- [ ] Create `editorCommands.ts` with command interface
- [ ] Implement commands: `EditTextCommand`, `EditStyleCommand`, `MoveElementCommand`
- [ ] Add command executor with undo/redo support
- [ ] Add command batching for performance

#### 4.1.4 Performance Utilities

- [ ] Create debounce utilities (300ms for text, 100ms for styles)
- [ ] Create memoization helpers for expensive operations
- [ ] Add performance monitoring hooks
- [ ] Implement request deduplication

**Deliverables:**

- Redux slice with full state management
- Core hooks with error handling
- Command pattern implementation
- Performance utilities

---

### Phase 2: Text Editing (Week 2)

#### 4.2.1 Text Editing Hook

- [ ] Create `useTextEditing.ts`
- [ ] Implement contentEditable with controlled updates
- [ ] Add text validation (prevent breaking HTML)
- [ ] Add paste handling (strip unwanted formatting)
- [ ] Add undo/redo for text edits

#### 4.2.2 Text Editor Component

- [ ] Create `TextEditor.tsx` overlay component
- [ ] Implement inline editing mode
- [ ] Add text formatting toolbar (bold, italic, etc.)
- [ ] Add character/word count
- [ ] Add save/cancel buttons

#### 4.2.3 Integration

- [ ] Integrate with `useSlideEditor`
- [ ] Add keyboard shortcuts (Enter to save, Esc to cancel)
- [ ] Add focus management
- [ ] Add accessibility (ARIA labels, keyboard navigation)

**Performance Considerations:**

- Debounce text updates (300ms)
- Use `requestIdleCallback` for non-critical updates
- Batch DOM updates
- Virtualize large text blocks if needed

**Deliverables:**

- Fully functional text editing
- Undo/redo support
- Keyboard shortcuts
- Accessibility compliance

---

### Phase 3: Style Editing (Week 3)

#### 4.3.1 Style Editing Hook

- [ ] Create `useStyleEditing.ts`
- [ ] Implement style property updates (color, font, size, spacing)
- [ ] Add style validation (prevent invalid CSS)
- [ ] Add style presets/templates
- [ ] Add bulk style operations

#### 4.3.2 Style Editor Component

- [ ] Create `StyleEditor.tsx` panel component
- [ ] Add color picker with preset colors
- [ ] Add font selector with web-safe fonts
- [ ] Add size/spacing sliders
- [ ] Add live preview
- [ ] Add style reset functionality

#### 4.3.3 Integration

- [ ] Integrate with `useSlideEditor`
- [ ] Add style history tracking
- [ ] Add style comparison (before/after)
- [ ] Add style export/import

**Performance Considerations:**

- Debounce style updates (100ms)
- Use CSS custom properties for theme support
- Cache computed styles
- Batch style updates using `requestAnimationFrame`

**Deliverables:**

- Comprehensive style editing
- Live preview
- Style presets
- Performance optimized

---

### Phase 4: Element Positioning (Week 4)

#### 4.4.1 Drag & Drop Hook

- [ ] Create `useDragAndDrop.ts`
- [ ] Implement drag detection and handling
- [ ] Add position constraints (within slide bounds)
- [ ] Add snap-to-grid functionality
- [ ] Add collision detection
- [ ] Add undo/redo for moves

#### 4.4.2 Drag Handles Component

- [ ] Create `DragHandles.tsx` component
- [x] Add resize handles (for images, divs) - **IMPLEMENTED EARLY** (Phase 2)
- [ ] Add rotation handles (if needed)
- [ ] Add visual feedback during drag
- [ ] Add keyboard navigation (arrow keys)

**Note:** Resize handles (`ResizeHandles.tsx`) were implemented early in Phase 2 as they complement element selection UX. Full drag & drop positioning will be added in Phase 4.

#### 4.4.3 Integration

- [ ] Integrate with `useSlideEditor`
- [ ] Add position history
- [ ] Add grid overlay toggle
- [ ] Add alignment guides
- [ ] Add layer ordering (z-index)

**Performance Considerations:**

- Use `transform` instead of `top/left` for better performance
- Throttle drag events (16ms for 60fps)
- Use `will-change` CSS property
- Debounce final position updates (150ms)

**Deliverables:**

- Smooth drag & drop
- Position constraints
- Grid snapping
- Performance optimized

---

### Phase 5: Advanced Features (Week 5)

#### 4.5.1 Element Deletion

- [ ] Add delete confirmation dialog
- [ ] Implement soft delete (undo support)
- [ ] Add bulk delete functionality
- [ ] Add delete history

#### 4.5.2 Element Duplication

- [ ] Add clone functionality
- [ ] Implement smart positioning (offset duplicated element)
- [ ] Add duplicate history

#### 4.5.3 Save & Persistence

- [ ] Create `slideEditService.ts` for API calls
- [ ] Implement auto-save (debounced, every 30s)
- [ ] Add manual save button
- [ ] Add save status indicator
- [ ] Add conflict resolution
- [ ] Add optimistic updates

#### 4.5.4 Undo/Redo System

- [ ] Create `useUndoRedo.ts` hook
- [ ] Implement command history (max 50 operations)
- [ ] Add history navigation
- [ ] Add history visualization
- [ ] Persist history to localStorage (optional)

**Deliverables:**

- Complete editing feature set
- Auto-save functionality
- Robust undo/redo
- Error handling

---

### Phase 6: Polish & Optimization (Week 6)

#### 4.6.1 Error Handling

- [ ] Add error boundaries for all editing components
- [ ] Add error recovery mechanisms
- [ ] Add user-friendly error messages
- [ ] Add error logging to monitoring service

#### 4.6.2 Performance Optimization

- [ ] Profile and optimize render cycles
- [ ] Add React.memo where needed
- [ ] Optimize Redux selectors
- [ ] Add code splitting for editing tools
- [ ] Add lazy loading for heavy components

#### 4.6.3 Testing

- [ ] Unit tests for hooks (80%+ coverage)
- [ ] Integration tests for editing flows
- [ ] E2E tests for critical paths
- [ ] Performance tests (Lighthouse CI)
- [ ] Accessibility tests (aXe)

#### 4.6.4 Documentation

- [ ] Code documentation (JSDoc)
- [ ] Architecture documentation
- [ ] User guide for editing features
- [ ] Developer onboarding guide

**Deliverables:**

- Production-ready code
- Comprehensive tests
- Full documentation
- Performance optimized

---

## 5. Performance Strategies

### 5.1 Debouncing Strategy

```typescript
// Text editing: 300ms debounce
const debouncedTextUpdate = useDebounce(updateText, 300);

// Style editing: 100ms debounce
const debouncedStyleUpdate = useDebounce(updateStyle, 100);

// Position updates: 150ms debounce
const debouncedPositionUpdate = useDebounce(updatePosition, 150);

// Auto-save: 30s debounce
const debouncedAutoSave = useDebounce(saveChanges, 30000);
```

### 5.2 Memoization Strategy

```typescript
// Memoize expensive computations
const processedStyles = useMemo(
  () => computeStyles(element),
  [element.id, element.className],
);

// Memoize callbacks
const handleEdit = useCallback(
  (elementId: string) => {
    // Edit logic
  },
  [elementId],
);

// Memoize Redux selectors
const selectEditingSlide = useMemo(
  () =>
    createSelector(
      [selectSlideEditState, (state, slideId) => slideId],
      (editState, slideId) => editState.editingSlides[slideId],
    ),
  [],
);
```

### 5.3 Virtualization

- Use `react-window` or `react-virtualized` for large slide lists
- Only render visible editing tools
- Lazy load style editor panels

### 5.4 Request Deduplication

```typescript
// Prevent duplicate save requests
const pendingSaves = new Map<string, AbortController>();

function saveSlide(slideId: string, data: SlideData) {
  // Cancel previous save if pending
  if (pendingSaves.has(slideId)) {
    pendingSaves.get(slideId)?.abort();
  }

  const controller = new AbortController();
  pendingSaves.set(slideId, controller);

  // Perform save
  return api
    .saveSlide(slideId, data, { signal: controller.signal })
    .finally(() => pendingSaves.delete(slideId));
}
```

---

## 6. Error Handling Strategy

### 6.1 Error Boundaries

```typescript
// EditingErrorBoundary.tsx
class EditingErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log to monitoring service
    logError(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />;
    }
    return this.props.children;
  }
}
```

### 6.2 Error Recovery

- Auto-save before critical operations
- Provide "Retry" options
- Show user-friendly error messages
- Log errors for debugging

### 6.3 Validation

```typescript
// validation.ts
export function validateHTML(html: string): ValidationResult {
  // Check for invalid HTML
  // Check for XSS vulnerabilities
  // Check for broken structure
  // Return validation result
}

export function validateStyle(style: CSSStyleDeclaration): ValidationResult {
  // Check for invalid CSS properties
  // Check for security issues
  // Return validation result
}
```

---

## 7. Security Considerations

### 7.1 XSS Prevention

- Sanitize all user input
- Use DOMPurify for HTML cleaning
- Validate all iframe content
- Escape all user-generated content

### 7.2 Content Security Policy

- Ensure CSP allows necessary operations
- Use nonce for inline scripts
- Validate all postMessage origins

### 7.3 Input Validation

- Validate HTML structure before saving
- Validate CSS properties
- Limit operation frequency (rate limiting)

---

## 8. Testing Strategy

### 8.1 Unit Tests

```typescript
// hooks/__tests__/useTextEditing.test.ts
describe("useTextEditing", () => {
  it("should update text content correctly", () => {
    // Test implementation
  });

  it("should handle undo/redo", () => {
    // Test implementation
  });

  it("should validate HTML structure", () => {
    // Test implementation
  });
});
```

### 8.2 Integration Tests

- Test editing flows end-to-end
- Test Redux state updates
- Test iframe communication
- Test error recovery

### 8.3 E2E Tests

- Test complete editing workflows
- Test save/load functionality
- Test undo/redo
- Test multi-slide editing

### 8.4 Performance Tests

- Lighthouse CI for performance metrics
- Load testing for concurrent users
- Memory leak detection
- Bundle size monitoring

---

## 9. Monitoring & Analytics

### 9.1 Performance Monitoring

```typescript
// Track operation performance
function trackOperation(operation: string, duration: number) {
  analytics.track("edit_operation", {
    operation,
    duration,
    timestamp: Date.now(),
  });
}
```

### 9.2 Error Tracking

- Log all errors to monitoring service
- Track error rates
- Alert on critical errors

### 9.3 User Analytics

- Track editing feature usage
- Track common editing patterns
- Track performance metrics
- Track user satisfaction

---

## 10. Code Quality Standards

### 10.1 TypeScript

- Strict type checking
- No `any` types
- Proper interface definitions
- Type-safe Redux actions

### 10.2 Code Style

- ESLint configuration
- Prettier formatting
- Consistent naming conventions
- JSDoc comments for public APIs

### 10.3 Code Review Checklist

- [ ] Performance considerations addressed
- [ ] Error handling implemented
- [ ] Tests written
- [ ] Documentation updated
- [ ] Accessibility checked
- [ ] Security reviewed

---

## 11. Rollout Strategy

### 11.1 Feature Flags

```typescript
// Use feature flags for gradual rollout
const EDITING_ENABLED = process.env.NEXT_PUBLIC_EDITING_ENABLED === "true";
const EDITING_BETA = process.env.NEXT_PUBLIC_EDITING_BETA === "true";
```

### 11.2 Phased Rollout

1. **Internal Testing (Week 1)**: Team only
2. **Beta Testing (Week 2)**: 10% of users
3. **Gradual Rollout (Week 3-4)**: 25%, 50%, 100%
4. **Monitor & Optimize**: Continuous

### 11.3 Rollback Plan

- Feature flag for instant disable
- Database migration rollback scripts
- Cache invalidation strategy
- Monitoring alerts

---

## 12. Success Metrics

### 12.1 Performance Metrics

- Page load time < 2s
- Editing operation latency < 100ms
- Auto-save success rate > 99%
- Zero memory leaks

### 12.2 User Metrics

- Editing feature adoption rate
- Average edits per slide
- Time to complete editing
- User satisfaction score

### 12.3 Technical Metrics

- Error rate < 0.1%
- Test coverage > 80%
- Bundle size increase < 50KB
- API response time < 500ms

---

## 13. Risk Mitigation

### 13.1 Technical Risks

| Risk                     | Impact   | Mitigation                                       |
| ------------------------ | -------- | ------------------------------------------------ |
| Performance degradation  | High     | Comprehensive performance testing, optimization  |
| Memory leaks             | High     | Memory profiling, cleanup on unmount             |
| Data loss                | Critical | Auto-save, conflict resolution, backups          |
| Security vulnerabilities | Critical | Input validation, XSS prevention, security audit |

### 13.2 Business Risks

| Risk                   | Impact | Mitigation                            |
| ---------------------- | ------ | ------------------------------------- |
| Low adoption           | Medium | User research, iterative improvements |
| Increased support load | Medium | Comprehensive documentation, tooltips |
| Feature complexity     | Medium | Progressive disclosure, onboarding    |

---

## 14. Dependencies

### 14.1 New Dependencies

```json
{
  "dompurify": "^3.0.0", // HTML sanitization
  "react-window": "^1.8.10", // Virtualization
  "immer": "^10.0.0", // Immutable updates (not needed)
  "zod": "^3.22.0" // Validation (if needed)
}
```

### 14.2 Existing Dependencies

- React 18+
- Redux Toolkit
- TypeScript
- Next.js

---

## 15. Timeline Summary

| Phase                      | Duration | Key Deliverables                     |
| -------------------------- | -------- | ------------------------------------ |
| Phase 1: Foundation        | Week 1   | State management, hooks, utilities   |
| Phase 2: Text Editing      | Week 2   | Text editing functionality           |
| Phase 3: Style Editing     | Week 3   | Style editing functionality          |
| Phase 4: Positioning       | Week 4   | Drag & drop functionality            |
| Phase 5: Advanced Features | Week 5   | Delete, duplicate, save, undo/redo   |
| Phase 6: Polish            | Week 6   | Testing, optimization, documentation |

**Total Duration: 6 weeks**

---

## 16. Next Steps

1. **Review & Approval**: Get stakeholder approval
2. **Setup**: Create file structure and initial files
3. **Phase 1 Start**: Begin with foundation & infrastructure
4. **Daily Standups**: Track progress and blockers
5. **Weekly Reviews**: Review code quality and progress
6. **Continuous Integration**: Set up CI/CD pipeline

---

## Appendix: Code Examples

### A.1 Hook Structure Example

```typescript
// hooks/presentation/useTextEditing.ts
export function useTextEditing(
  slideId: string,
  elementId: string,
  iframeRef: RefObject<HTMLIFrameElement>,
) {
  const dispatch = useAppDispatch();
  const [isEditing, setIsEditing] = useState(false);
  const [textContent, setTextContent] = useState("");

  const debouncedUpdate = useDebounce((newText: string) => {
    // Update logic
  }, 300);

  const handleTextChange = useCallback(
    (newText: string) => {
      setTextContent(newText);
      debouncedUpdate(newText);
      dispatch(trackChange({ slideId, elementId, type: "text" }));
    },
    [slideId, elementId, dispatch],
  );

  return {
    isEditing,
    textContent,
    startEditing: () => setIsEditing(true),
    stopEditing: () => setIsEditing(false),
    handleTextChange,
  };
}
```

### A.2 Command Pattern Example

```typescript
// lib/presentation/editing/editorCommands.ts
interface Command {
  execute(): void;
  undo(): void;
  redo(): void;
}

class EditTextCommand implements Command {
  constructor(
    private element: HTMLElement,
    private oldText: string,
    private newText: string,
  ) {}

  execute() {
    this.element.textContent = this.newText;
  }

  undo() {
    this.element.textContent = this.oldText;
  }

  redo() {
    this.execute();
  }
}
```

---

**Document Version**: 1.0  
**Last Updated**: [Current Date]  
**Author**: Engineering Team  
**Reviewers**: [To be assigned]
