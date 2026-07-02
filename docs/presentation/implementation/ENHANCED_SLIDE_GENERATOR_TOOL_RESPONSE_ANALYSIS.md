# Enhanced Slide Generator Tool Response Analysis

## Overview

When a user provides a follow-up query, the system generates enhanced slide generation logs that update slide data. This document analyzes the new socket event structure and proposes how to handle it in the existing system.

## Current Socket Event Structure

### New Event Format

```json
{
  "type": "tool_response",
  "author": "enhanced_slide_generator",
  "p_id": "691ecd66f776019b08abf3c6",
  "tool_name": "generate_slide_html_sync",
  "tool_response": {
    "result": "{\"thinking\": \"...\", \"generated_html\": \"...\"}"
  },
  "tool_event": "generate_slide_html_sync",
  "timestamp": "2025-11-20T09:08:31.026435+00:00",
  "event_id": "temp_773edd4650c347968912d35a247f8f11",
  "slide_index": 0,
  "thinking": "...", // Duplicate at top level
  "html_content": "...", // Duplicate at top level
  "user_id": "6881b8c316f5b89436dc0b73",
  "worker_id": "691eb7451d3559beb579db96"
}
```

## Key Differences from Current Implementation

### 1. **Author Format**

- **Current Expected**: `"enhanced_slide_generator_<number>"` (e.g., `"enhanced_slide_generator_1"`)
- **New Format**: `"enhanced_slide_generator"` (no number suffix)
- **Solution**: Extract slide number from `slide_index` field instead of author string

### 2. **Message Type**

- **Current**: No specific `type` field, or `type: "agent_output"`
- **New Format**: `type: "tool_response"`
- **Solution**: Add handling for `type: "tool_response"` in `parseAgentOutput`

### 3. **Data Location**

- **Current Expected**: `message.thinking` and `message.html_content` directly on message
- **New Format**:
  - Primary: Nested in `tool_response.result` as a **JSON string** that needs parsing
  - Secondary: Also available at top level (`message.thinking`, `message.html_content`)
- **Solution**: Parse `tool_response.result` JSON string first, fallback to top-level fields

### 4. **Slide Number Source**

- **Current**: Extracted from author string pattern: `enhanced_slide_generator_(\d+)`
- **New Format**: Provided directly as `slide_index: 0`
- **Solution**: Use `slide_index` field when available, fallback to author pattern extraction

### 5. **Slide Reordering (CRITICAL - Missing from Initial Analysis)**

- **Scenario**: User provides follow-up query to add a new slide at a specific position
- **Example**: Existing slides [0, 1, 2, 3], new slide comes with `slide_index: 2`
- **Expected Behavior**:
  - New slide becomes slideNumber 2
  - Existing slide 2 → becomes slideNumber 3
  - Existing slide 3 → becomes slideNumber 4
  - Final: [0, 1, 2 (new), 3 (was 2), 4 (was 3)]
- **Current Implementation**: ❌ **DOES NOT HANDLE REORDERING**
  - Current `updateSlide` reducer only:
    - Creates new slide and sorts (doesn't renumber existing)
    - Updates existing slide (doesn't handle insertion)
- **Solution**: Add `insertSlide` action or extend `updateSlide` with `type: "insert"` to handle reordering

## Current System Flow

### 1. **Parser Entry Point** (`parseAgentOutput`)

```javascript
// Current routing logic
if (author?.startsWith("enhanced_slide_generator_")) {
  const parsed = parseEnhancedSlideGenerator(
    message,
    currentState.slides || [],
  );
  return { type: "slide", ...parsed };
}
```

### 2. **Slide Parser** (`parseEnhancedSlideGenerator`)

```javascript
// Current implementation expects:
- message.author = "enhanced_slide_generator_1"
- message.thinking (optional)
- message.html_content (optional)
```

### 3. **Redux Update** (`updateSlide`)

```javascript
// Redux expects:
{
  type: "update" | "create",
  slideIndex: number,
  slideEntry: {
    slideNumber: number,
    thinking: string | null,
    htmlContent: string | null,
    isComplete: boolean
  }
}
```

## Slide Reordering Problem

### Current Issue

When a follow-up query adds a new slide at a specific index (e.g., `slide_index: 2`), the system needs to:

1. **Insert the new slide** at the specified index
2. **Renumber all affected slides** (slides at and after the insertion point)
3. **Update Redux state** with new slide numbers
4. **Do this efficiently** (O(n) operation, not O(n²))

### Example Scenario

**Before:**

```
Slides: [
  { slideNumber: 0, ... },
  { slideNumber: 1, ... },
  { slideNumber: 2, ... },
  { slideNumber: 3, ... }
]
```

**User Request:** "Add a new slide between slide 1 and 2"

**New Event:** `slide_index: 2`

**After (Expected):**

```
Slides: [
  { slideNumber: 0, ... },
  { slideNumber: 1, ... },
  { slideNumber: 2, ... },  // NEW SLIDE
  { slideNumber: 3, ... },  // Was slideNumber 2
  { slideNumber: 4, ... }   // Was slideNumber 3
]
```

### Current Redux Implementation Gap

The current `updateSlide` reducer:

- ✅ Handles "create" (appends and sorts)
- ✅ Handles "update" (updates existing)
- ❌ **Does NOT handle "insert" with reordering**

**Current "create" logic:**

```javascript
// Just pushes and sorts - doesn't renumber existing slides
state.slides.push(slideEntry);
state.slides.sort((a, b) => a.slideNumber - b.slideNumber);
```

**Problem:** If new slide has `slideNumber: 2` and existing slide also has `slideNumber: 2`, they will conflict or overwrite.

## Proposed Solution

### Option 1: Extend Current Parser + Add Insert Action (Recommended)

**Advantages:**

- Minimal changes to existing code
- Backward compatible with existing format
- Centralized logic

**Implementation Steps:**

1. **Update `parseAgentOutput` to handle `type: "tool_response"`**

   ```javascript
   // Check for tool_response type
   if (
     message.type === "tool_response" &&
     message.author === "enhanced_slide_generator"
   ) {
     // Normalize message format before passing to parser
     const normalizedMessage = normalizeToolResponseMessage(message);
     const parsed = parseEnhancedSlideGenerator(
       normalizedMessage,
       currentState.slides || [],
     );
     return { type: "slide", ...parsed };
   }
   ```

2. **Create `normalizeToolResponseMessage` function**

   ```javascript
   /**
    * Normalize tool_response message to match expected format
    * @param {Object} message - Raw tool_response message
    * @returns {Object} Normalized message
    */
   const normalizeToolResponseMessage = (message) => {
     // Extract slide number from slide_index
     const slideNumber =
       message.slide_index ?? extractSlideGeneratorNumber(message.author) ?? 0;

     // Construct author with number suffix for consistency
     const normalizedAuthor = `enhanced_slide_generator_${slideNumber}`;

     // Parse tool_response.result if it exists
     let thinking = null;
     let htmlContent = null;

     if (message.tool_response?.result) {
       try {
         const parsedResult = JSON.parse(message.tool_response.result);
         thinking = parsedResult.thinking || message.thinking || null;
         htmlContent =
           parsedResult.generated_html ||
           parsedResult.html_content ||
           message.html_content ||
           null;
       } catch (e) {
         console.warn("[Parser] Failed to parse tool_response.result:", e);
         // Fallback to top-level fields
         thinking = message.thinking || null;
         htmlContent = message.html_content || null;
       }
     } else {
       // Use top-level fields directly
       thinking = message.thinking || null;
       htmlContent = message.html_content || null;
     }

     return {
       ...message,
       author: normalizedAuthor,
       thinking,
       html_content: htmlContent,
       // Preserve original slide_index for reference
       slide_index: slideNumber,
     };
   };
   ```

3. **Update `parseEnhancedSlideGenerator` to handle slide_index and detect insertions**

   ```javascript
   export const parseEnhancedSlideGenerator = (
     message,
     existingSlides = [],
   ) => {
     // Try slide_index first, then extract from author
     const slideNumber =
       message.slide_index ??
       extractSlideGeneratorNumber(message.author) ??
       null;

     if (slideNumber === null) {
       console.error("[Parser] Cannot determine slide number");
       return null;
     }

     const slideAuthor = `enhanced_slide_generator_${slideNumber}`;

     // Check if this is an insertion (new slide at existing position)
     const existingSlideIndex = existingSlides.findIndex(
       (slide) => slide.slideNumber === slideNumber,
     );

     const isInsertion =
       existingSlideIndex !== -1 &&
       !existingSlides[existingSlideIndex].isComplete;

     // Determine what data this message contains
     const hasThinking = !!message.thinking;
     const hasHtmlContent = !!message.html_content;

     if (existingSlideIndex !== -1 && !isInsertion) {
       // Update existing slide (normal update)
       // ... existing update logic
     } else {
       // New slide or insertion - need to reorder
       return {
         type: "slide",
         updateType: isInsertion ? "insert" : "create",
         insertIndex: slideNumber, // Position to insert at
         slideEntry: {
           slideNumber,
           // ... slide data
         },
       };
     }
   };
   ```

4. **Add `insertSlide` action to Redux reducer** (NEW)

   ```javascript
   /**
    * Insert a new slide at a specific index and reorder existing slides
    * Optimized O(n) operation
    */
   insertSlide(state, action) {
     const { insertIndex, slideEntry } = action.payload;

     console.log("[Redux] Inserting slide at index:", insertIndex);

     // Check if slide already exists at this number
     const existingIndex = state.slides.findIndex(
       (s) => s.slideNumber === insertIndex,
     );

     if (existingIndex !== -1) {
       // Slide exists - this is an insertion, need to reorder
       console.log("[Redux] Reordering slides after insertion at:", insertIndex);

       // Renumber all slides at and after insertion point
       // O(n) operation - single pass through array
       const reorderedSlides = state.slides.map((slide) => {
         if (slide.slideNumber >= insertIndex) {
           return {
             ...slide,
             slideNumber: slide.slideNumber + 1,
             author: `enhanced_slide_generator_${slide.slideNumber + 1}`,
           };
         }
         return slide;
       });

       // Insert new slide at correct position
       reorderedSlides.splice(insertIndex, 0, slideEntry);

       // Update state
       state.slides = reorderedSlides;

       console.log("[Redux] ✅ Slide inserted and reordered:", {
         insertIndex,
         totalSlides: state.slides.length,
         slideNumbers: state.slides.map((s) => s.slideNumber),
       });
     } else {
       // No conflict - just insert at correct position
       // Find insertion point (maintain sorted order)
       let insertPosition = state.slides.findIndex(
         (s) => s.slideNumber > insertIndex,
       );

       if (insertPosition === -1) {
         insertPosition = state.slides.length; // Append at end
       }

       state.slides.splice(insertPosition, 0, slideEntry);
       console.log("[Redux] ✅ Slide inserted without reordering");
     }

     // Update derived state
     state.currentPhase = deriveCurrentPhase(state.logs, state.slides);
     state.completedPhases = deriveCompletedPhases(state.logs, state.slides);
   },
   ```

5. **Update socket handler to dispatch insert action**
   ```javascript
   case "slide":
     if (parsed.updateType === "insert") {
       dispatch(insertSlide({
         insertIndex: parsed.insertIndex,
         slideEntry: parsed.slideEntry,
       }));
     } else {
       // Existing update/create logic
       dispatch(updateSlide({ ... }));
     }
     break;
   ```

### Option 2: Create Separate Parser Function

**Advantages:**

- Clear separation of concerns
- Easier to test
- Can handle tool_response-specific logic

**Disadvantages:**

- More code duplication
- Two code paths to maintain

## Data Flow Diagram

```
Socket Event (tool_response)
    ↓
parseAgentOutput()
    ↓
Check: type === "tool_response" && author === "enhanced_slide_generator"
    ↓
normalizeToolResponseMessage()
    ├─ Extract slide_index → slideNumber
    ├─ Parse tool_response.result JSON
    ├─ Extract thinking & html_content
    └─ Construct normalized author: "enhanced_slide_generator_<number>"
    ↓
parseEnhancedSlideGenerator(normalizedMessage)
    ├─ Find existing slide by slideNumber
    ├─ Update or create slide entry
    └─ Return { type: "slide", updateType, slideEntry }
    ↓
usePresentationSocket.processAgentOutputMessage()
    ↓
Dispatch updateSlide() to Redux
    ↓
Redux updateSlide reducer
    ├─ Update existing slide OR
    └─ Create new slide
    ↓
UI re-renders with updated slide data
```

## Edge Cases to Handle

### 1. **Missing slide_index**

- **Scenario**: `slide_index` is undefined/null
- **Solution**: Fallback to extracting from author string, then default to 0

### 6. **Insertion at Existing Position** (NEW)

- **Scenario**: New slide has `slide_index: 2`, but slide 2 already exists
- **Solution**:
  - Detect this as an insertion (not update)
  - Renumber existing slide 2 → 3, 3 → 4, etc.
  - Insert new slide at position 2
  - Use optimized O(n) reordering algorithm

### 7. **Insertion at End**

- **Scenario**: New slide has `slide_index: 5`, but only 3 slides exist [0, 1, 2]
- **Solution**:
  - No reordering needed
  - Simply append new slide
  - Or insert at specified index (may leave gaps - need to clarify expected behavior)

### 8. **Multiple Insertions in Sequence**

- **Scenario**: User adds slide at index 2, then another at index 3
- **Solution**:
  - First insertion: [0, 1, 2 (new), 3 (was 2), 4 (was 3)]
  - Second insertion: [0, 1, 2, 3 (new), 4 (was 2), 5 (was 3), 6 (was 4)]
  - Each insertion triggers reordering independently
  - **Performance**: O(n) per insertion, but if many insertions, consider batching

### 2. **Invalid JSON in tool_response.result**

- **Scenario**: `tool_response.result` is not valid JSON
- **Solution**: Catch parse error, fallback to top-level `thinking` and `html_content`

### 3. **Missing tool_response.result**

- **Scenario**: `tool_response` object doesn't have `result` field
- **Solution**: Use top-level `thinking` and `html_content` directly

### 4. **Both formats in same session**

- **Scenario**: Some slides use old format, some use new format
- **Solution**: Normalization function handles both, ensuring consistent internal format

### 5. **Duplicate data**

- **Scenario**: Data exists in both `tool_response.result` and top-level
- **Solution**: Prioritize `tool_response.result` (more structured), fallback to top-level

## Testing Considerations

### Test Cases

1. **New Format (tool_response)**

   ```javascript
   {
     type: "tool_response",
     author: "enhanced_slide_generator",
     slide_index: 0,
     tool_response: {
       result: '{"thinking": "...", "generated_html": "..."}'
     }
   }
   ```

2. **Old Format (backward compatibility)**

   ```javascript
   {
     author: "enhanced_slide_generator_1",
     thinking: "...",
     html_content: "..."
   }
   ```

3. **Mixed Format (tool_response with top-level fields)**

   ```javascript
   {
     type: "tool_response",
     author: "enhanced_slide_generator",
     slide_index: 0,
     tool_response: { result: '{"thinking": "..."}' },
     html_content: "..." // Top-level fallback
   }
   ```

4. **Invalid JSON in tool_response.result**

   ```javascript
   {
     type: "tool_response",
     author: "enhanced_slide_generator",
     slide_index: 0,
     tool_response: { result: "invalid json" },
     thinking: "...", // Should use this
     html_content: "..."
   }
   ```

5. **Missing slide_index**
   ```javascript
   {
     type: "tool_response",
     author: "enhanced_slide_generator_2", // Extract from here
     tool_response: { result: '{"thinking": "...", "generated_html": "..."}' }
   }
   ```

## Implementation Checklist

### Parser Updates

- [ ] Add `type: "tool_response"` check in `parseAgentOutput`
- [ ] Create `normalizeToolResponseMessage` function
- [ ] Update `parseEnhancedSlideGenerator` to handle `slide_index`
- [ ] Add detection logic for insertions vs updates
- [ ] Add JSON parsing for `tool_response.result`
- [ ] Add error handling for invalid JSON
- [ ] Add fallback logic for missing fields

### Redux Updates (CRITICAL - NEW)

- [ ] Add `insertSlide` action to `presentationSlice`
- [ ] Implement optimized O(n) reordering algorithm
- [ ] Handle insertion at existing position
- [ ] Handle insertion at end
- [ ] Update slide numbers and authors during reorder
- [ ] Update derived state after reordering

### Socket Handler Updates

- [ ] Update `usePresentationSocket` to handle `updateType: "insert"`
- [ ] Dispatch `insertSlide` for insertions
- [ ] Maintain backward compatibility with update/create

### Testing

- [ ] Test with new format (tool_response)
- [ ] Test backward compatibility (old format)
- [ ] Test edge cases (missing fields, invalid JSON)
- [ ] **Test insertion at middle position** (NEW)
- [ ] **Test insertion at beginning** (NEW)
- [ ] **Test insertion at end** (NEW)
- [ ] **Test multiple sequential insertions** (NEW)
- [ ] **Test reordering performance with many slides** (NEW)
- [ ] Verify Redux state updates correctly
- [ ] Verify UI displays updated slides correctly
- [ ] Verify slide numbers are correct after reordering

## Files to Modify

1. **`src/utils/presentation/presentationDataParser.js`**
   - Add `normalizeToolResponseMessage` function
   - Update `parseAgentOutput` to handle `type: "tool_response"`
   - Update `parseEnhancedSlideGenerator` to use `slide_index`

2. **Testing**
   - Unit tests for normalization function
   - Integration tests for full flow
   - Edge case tests

## Performance Considerations

1. **JSON Parsing**: `JSON.parse()` is synchronous but fast for typical slide data sizes
2. **Normalization**: Minimal overhead, only runs for tool_response messages
3. **Backward Compatibility**: No performance impact on existing messages
4. **Slide Reordering** (CRITICAL):
   - **Current**: O(n log n) - sort after each insertion
   - **Proposed**: O(n) - single pass reordering
   - **Optimization**: Use `map()` to renumber in one pass, then `splice()` to insert
   - **Worst Case**: O(n) for each insertion
   - **Best Case**: O(1) if inserting at end with no conflicts
   - **Consideration**: If many insertions happen rapidly, consider batching

### Reordering Algorithm Complexity

**Proposed Algorithm:**

```javascript
// O(n) - single pass through slides array
const reorderedSlides = state.slides.map((slide) => {
  if (slide.slideNumber >= insertIndex) {
    return { ...slide, slideNumber: slide.slideNumber + 1 };
  }
  return slide;
});

// O(1) - array insertion at specific index
reorderedSlides.splice(insertIndex, 0, slideEntry);
```

**Time Complexity:** O(n) where n = number of slides
**Space Complexity:** O(n) for new array (can be optimized to in-place if needed)

## Security Considerations

1. **JSON Parsing**: Validate JSON size before parsing to prevent DoS
2. **Data Validation**: Ensure `slide_index` is a valid number
3. **Error Handling**: Don't expose parsing errors to users

## Summary

The new `tool_response` format requires:

1. Handling `type: "tool_response"` in the parser
2. Extracting slide number from `slide_index` instead of author string
3. Parsing nested JSON in `tool_response.result`
4. Maintaining backward compatibility with existing format
5. **CRITICAL: Handling slide reordering when inserting at specific positions**

### Key Implementation Points

1. **Parser**: Normalize message format and detect insertions vs updates
2. **Redux**: Add `insertSlide` action with optimized O(n) reordering
3. **Socket Handler**: Route insertions to new action, updates/creates to existing action
4. **Performance**: Single-pass reordering algorithm, avoid multiple sorts

### Reordering Strategy

- **Detection**: If `slide_index` matches existing slide number → insertion
- **Algorithm**: O(n) single-pass renumbering, then O(1) insertion
- **Optimization**: Consider batching if multiple insertions happen rapidly
- **Edge Cases**: Handle insertions at beginning, middle, and end positions

The recommended approach is to:

1. Normalize the message format before passing to parser
2. Detect insertions in the parser
3. Add optimized reordering logic in Redux
4. Maintain backward compatibility with existing update/create flows
