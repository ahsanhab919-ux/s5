# Tool Call Agent Implementation Plan

## Overview

This document outlines the implementation plan for handling tool call agent socket events in the presentation system. Tool calls represent agents performing specific tasks (e.g., `topic_checker_agent`, `query_enhancer_agent`) and need to be displayed in the UI with a consistent, professional appearance.

## Socket Event Structure

### Real-Time Socket Events

Tool call events from socket have the following structure:

```json
{
  "type": "tool_call",
  "agent_name": "topic_checker_agent", // or "query_enhancer_agent", etc.
  "p_id": "691ea3dc6a26663aede23873",
  "text": "checking topic", // or "enhancing the user query"
  "timestamp": "2025-11-20T05:15:19.937506+00:00",
  "event_id": "691ea3e79eb8492cec416bef",
  "user_id": "6881b8c316f5b89436dc0b73",
  "worker_id": "691e9bc89eb8492cec416b40"
}
```

**Key Differences from Other Events:**

- Uses `type: "tool_call"` instead of `type: "agent_output"`
- Uses `agent_name` field instead of `author` field
- Has a `text` field describing the action

### History API Events

Tool call events from history API have a different structure:

```json
{
  "author": "topic_checker_agent",
  "timestamp": "2025-11-20T04:46:18.643803+00:00",
  "parsed_output": "checking topic" // String, not JSON
}
```

**Key Differences from Real-Time:**

- Uses `author` field (not `agent_name`)
- Uses `parsed_output` as a **string** (not `text` field)
- No `type: "tool_call"` field
- `parsed_output` is a plain string, not JSON (unlike other agents)

**Note:** The parser must handle both formats and normalize them to the same structure for consistency.

## Implementation Steps

### Phase 1: Data Parser Updates

#### 1.1 Update `presentationDataParser.js`

**Location:** `src/utils/presentation/presentationDataParser.js`

**Changes:**

1. Add `parseToolCall()` function to handle tool call messages
2. Update `parseAgentOutput()` to check for `type: "tool_call"` first
3. Normalize `agent_name` to `author` for consistency

**Implementation:**

```javascript
/**
 * Parse tool call agent output (Real-Time Socket Format)
 * Handles agents performing specific tool operations from socket events
 *
 * Real-time format:
 * - type: "tool_call"
 * - agent_name: "topic_checker_agent"
 * - text: "checking topic"
 *
 * @param {Object} message - Tool call message from socket
 * @returns {Object} Formatted log entry
 */
export const parseToolCall = (message) => {
  console.log("[Parser] Parsing tool call:", message);

  // Normalize agent_name to author for consistency
  const agentName = message.agent_name || message.author || "unknown_agent";
  // Real-time uses 'text' field
  const toolCallText = message.text || message.content || "";

  const logEntry = {
    id: generateLogId(agentName, message.timestamp),
    author: agentName, // Normalize agent_name to author
    text: toolCallText,
    content: toolCallText, // For UI compatibility
    timestamp: message.timestamp || new Date().toISOString(),
    phase: "planning", // Tool calls typically happen in planning phase
    // Preserve original fields for reference
    event_id: message.event_id,
    worker_id: message.worker_id,
  };

  return enrichLogEntry(logEntry);
};

// Update parseAgentOutput() to handle tool calls first
export const parseAgentOutput = (message, currentState = {}) => {
  console.log("[Parser] Parsing agent output:", {
    author: message.author || message.agent_name,
    type: message.type,
  });

  // Check for tool_call type FIRST (before author-based routing)
  if (message.type === "tool_call") {
    return {
      type: "log",
      data: parseToolCall(message),
    };
  }

  const { author } = message;

  // ... rest of existing routing logic
};
```

**Rationale:**

- Tool calls are identified by `type: "tool_call"`, not by author
- Normalize `agent_name` to `author` for consistency with existing code
- Preserve original fields for debugging/reference

### Phase 2: Message Type Classification

#### 2.1 Update `messageTypeClassifier.js.js`

**Location:** `src/utils/presentation/messageTypeClassifier.js.js`

**Changes:**

1. Add `TOOL_CALL` to `MESSAGE_TYPES` constant
2. Update `classifyMessageType()` to handle tool call agents
3. Support both known and unknown tool call agents

**Implementation:**

```javascript
export const MESSAGE_TYPES = {
  USER: "user",
  SPEC_EXTRACTOR: "spec_extractor",
  KEYWORD_RESEARCH: "keyword_research",
  BROWSER_WORKER: "browser_worker",
  PLANNING: "planning",
  SLIDE_GENERATION: "slide_generation",
  SLIDE_INSERTION_ORCHESTRATOR: "slide_insertion_orchestrator",
  SLIDE_ORCHESTRATION_AGENT: "slide_orchestration_agent",
  TOOL_CALL: "tool_call", // NEW
  UNKNOWN: "unknown",
};

/**
 * Map of known tool call agents to their display names
 */
const TOOL_CALL_AGENT_NAMES = {
  topic_checker_agent: "Topic Checker",
  query_enhancer_agent: "Query Enhancer",
  // Add more as they appear
};

/**
 * Get display name for tool call agent
 */
export function getToolCallAgentDisplayName(agentName) {
  return (
    TOOL_CALL_AGENT_NAMES[agentName] ||
    agentName?.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()) ||
    "Tool"
  );
}

export function classifyMessageType(author) {
  if (!author) return MESSAGE_TYPES.UNKNOWN;

  // Check if it's a known tool call agent
  if (TOOL_CALL_AGENT_NAMES[author] || author.endsWith("_agent")) {
    // Additional check: if it's not already classified as another type
    if (author === "user") return MESSAGE_TYPES.USER;
    if (author === "presentation_spec_extractor_agent")
      return MESSAGE_TYPES.SPEC_EXTRACTOR;
    if (author === "KeywordResearchAgent")
      return MESSAGE_TYPES.KEYWORD_RESEARCH;
    if (author.startsWith("browser_worker_"))
      return MESSAGE_TYPES.BROWSER_WORKER;
    if (author === "lightweight_planning_agent") return MESSAGE_TYPES.PLANNING;
    if (author === "LightweightSlideGeneration")
      return MESSAGE_TYPES.SLIDE_GENERATION;
    if (author === "slide_insertion_orchestrator")
      return MESSAGE_TYPES.SLIDE_INSERTION_ORCHESTRATOR;
    if (author === "slide_orchestration_agent")
      return MESSAGE_TYPES.SLIDE_ORCHESTRATION_AGENT;

    // If it ends with _agent and not matched above, treat as tool call
    if (author.endsWith("_agent")) {
      return MESSAGE_TYPES.TOOL_CALL;
    }
  }

  // ... existing logic
  return MESSAGE_TYPES.UNKNOWN;
}
```

**Rationale:**

- Tool calls are a distinct message type
- Support both known and unknown tool call agents
- Provide display name mapping for better UX

### Phase 3: UI Component

#### 3.1 Create `ToolCallLog.jsx`

**Location:** `src/components/presentation/v2/logs/ToolCallLog.jsx`

**Design Pattern:** Follow the same pattern as `KeywordResearchLog.jsx` and `PlanningLog.jsx`

**Implementation:**

```jsx
"use client";

import { cn } from "@/lib/utils";
import { Wrench, CheckCircle2 } from "lucide-react";
import { getToolCallAgentDisplayName } from "@/utils/presentation/messageTypeClassifier.js.js";

/**
 * ToolCallLog Component
 *
 * Displays tool call agent logs with:
 * - Tool indicator header (matching reference design)
 * - Agent name and action text
 * - Clean, minimal card design
 * - Consistent with other tool logs
 */
export default function ToolCallLog({ log }) {
  const agentName = log?.author || "";
  const toolCallText = log?.text || log?.content || "";
  const timestamp = log?.timestamp || log?.lastUpdated;
  const displayName = getToolCallAgentDisplayName(agentName);

  // Format timestamp for display
  const timeFormatter = new Intl.DateTimeFormat([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  const displayTime = timestamp
    ? timeFormatter.format(new Date(timestamp))
    : "";

  return (
    <div className="mb-6 flex justify-start">
      <div className="w-full max-w-[90%]">
        {/* Header bar with tool indicator - matching reference design */}
        <div className="mb-3 flex items-center gap-2">
          <Wrench className="text-muted-foreground h-4 w-4" />
          <span className="text-muted-foreground text-xs font-medium">
            Using Tool |
          </span>
          <span className="text-foreground text-xs font-semibold">
            {displayName}
          </span>
          {displayTime && (
            <>
              <span className="text-muted-foreground/50 mx-1">•</span>
              <span className="text-muted-foreground text-[11px]">
                {displayTime}
              </span>
            </>
          )}
        </div>

        {/* Main content container - minimal card design */}
        <div className="border-border bg-card rounded-lg border shadow-sm">
          {/* Card content */}
          <div className="flex items-center gap-3 px-4 py-3">
            {/* Status icon */}
            <div className="bg-primary/10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full">
              <CheckCircle2 className="text-primary h-4 w-4" />
            </div>

            {/* Action text */}
            <div className="min-w-0 flex-1">
              <p className="text-foreground text-sm leading-relaxed">
                {toolCallText}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

**Design Notes:**

- Minimal card design (no collapsible sections)
- Status icon indicates tool is active/completed
- Follows same visual pattern as other tool logs
- Responsive and accessible

### Phase 4: Router Integration

#### 4.1 Update `LogRouter.jsx`

**Location:** `src/components/presentation/v2/logs/LogRouter.jsx`

**Changes:**

1. Import `ToolCallLog` component
2. Add case for `MESSAGE_TYPES.TOOL_CALL`

**Implementation:**

```jsx
import ToolCallLog from "./ToolCallLog";

export default function LogRouter({ log, onViewSummary }) {
  // ... existing code

  switch (messageType) {
    // ... existing cases

    case MESSAGE_TYPES.TOOL_CALL:
      return <ToolCallLog log={log} />;

    default:
    // ... existing fallback
  }
}
```

### Phase 5: History Parser Support

#### 5.1 Update `presentationHistoryDataParser.js`

**Location:** `src/utils/presentation/presentationHistoryDataParser.js`

**Changes:**

1. Add `parseHistoryToolCall()` function
2. Update `parseHistoryLogEntry()` to handle tool call agents
3. Handle `parsed_output` field (string format for tool calls)

**History Data Structure:**

Tool calls in history have this structure:

```json
{
  "author": "topic_checker_agent",
  "timestamp": "2025-11-20T04:46:18.643803+00:00",
  "parsed_output": "checking topic" // String, not JSON
}
```

**Key Differences from Real-Time:**

- Uses `author` field (not `agent_name`)
- Uses `parsed_output` as a string (not `text` field)
- No `type: "tool_call"` field

**Implementation:**

```javascript
/**
 * Parse tool call from history
 * History tool calls have parsed_output as a string (not JSON)
 *
 * @param {Object} logEntry - History log entry
 * @returns {Object} Formatted log entry
 */
const parseHistoryToolCall = (logEntry) => {
  const { author, timestamp, parsed_output } = logEntry;

  // parsed_output is a string for tool calls (e.g., "checking topic")
  const toolCallText =
    typeof parsed_output === "string"
      ? parsed_output
      : parsed_output?.text || parsed_output?.content || "";

  const log = {
    id: generateHistoryLogId(author, timestamp),
    author: author || "unknown_agent",
    text: toolCallText,
    content: toolCallText, // For UI compatibility
    timestamp: timestamp || new Date().toISOString(),
    phase: "planning",
  };

  return enrichLogEntry(log);
};

// Update parseHistoryLogEntry()
const parseHistoryLogEntry = (logEntry, existingLogs = []) => {
  if (!logEntry || !logEntry.author) {
    console.warn("[HistoryParser] Invalid log entry:", logEntry);
    return null;
  }

  const { author, timestamp } = logEntry;

  try {
    // Route to appropriate parser based on author
    switch (author) {
      case "user":
        return parseHistoryUserMessage(logEntry);

      case "presentation_spec_extractor_agent":
        return parseHistoryPresentationSpecExtractor(logEntry);

      case "KeywordResearchAgent":
        return parseHistoryKeywordResearchAgent(logEntry);

      case "lightweight_planning_agent":
        return parseHistoryLightweightPlanningAgent(logEntry);

      case "LightweightSlideGeneration":
        return parseHistoryLightweightSlideGeneration(logEntry);

      case "slide_insertion_orchestrator":
        return parseHistorySlideInsertionOrchestrator(logEntry);

      case "slide_orchestration_agent":
        return parseHistorySlideOrchestrationAgent(logEntry);

      default:
        // Check if it's a browser worker
        if (author?.startsWith("browser_worker_")) {
          return parseHistoryBrowserWorker(logEntry, existingLogs);
        }

        // Check if it's a slide generator
        if (author?.startsWith("enhanced_slide_generator_")) {
          // Slide generators are handled separately, not as logs
          return null;
        }

        // Check for tool call agents (ends with _agent and not already handled)
        // Tool calls have parsed_output as a string, not JSON
        if (author?.endsWith("_agent")) {
          // Verify it's a tool call by checking parsed_output format
          const isToolCall =
            typeof logEntry.parsed_output === "string" &&
            !logEntry.parsed_output.trim().startsWith("{") &&
            !logEntry.parsed_output.trim().startsWith("[");

          if (isToolCall) {
            return parseHistoryToolCall(logEntry);
          }
        }

        // Unknown author - create generic log
        console.warn("[HistoryParser] Unknown author type:", author);
        return {
          id: generateHistoryLogId(author, timestamp),
          author: author || "unknown",
          data: { ...logEntry },
          timestamp: timestamp || new Date().toISOString(),
          phase: "unknown",
        };
    }
  } catch (error) {
    console.error("[HistoryParser] Error parsing log entry:", error, logEntry);
    return null;
  }
};
```

**Rationale:**

- History uses `parsed_output` as a string for tool calls (not JSON)
- Check for string format to distinguish tool calls from other agents
- Ensure history and real-time logs produce identical structures
- Support tool calls in historical data
- Maintain backward compatibility

### Phase 6: Socket Handler Verification

#### 6.1 Verify Socket Processing

**Location:** `src/hooks/usePresentationSocket.js`

**Verification:**

- Tool call messages should flow through existing `processAgentOutputMessage()`
- No changes needed if `parseAgentOutput()` handles tool calls correctly
- Verify duplicate detection works for tool calls

**Expected Flow:**

1. Socket receives `agent_output` event with `type: "tool_call"`
2. Message buffered → processed sequentially
3. `parseAgentOutput()` routes to `parseToolCall()`
4. Returns `{ type: "log", data: {...} }`
5. Dispatched via `addLog()` to Redux
6. UI renders via `LogRouter` → `ToolCallLog`

## Testing Checklist

### Unit Tests

- [ ] `parseToolCall()` handles all message formats
- [ ] `classifyMessageType()` correctly identifies tool calls
- [ ] `getToolCallAgentDisplayName()` returns proper display names
- [ ] History parser handles tool calls correctly

### Integration Tests

- [ ] Tool call messages flow through socket → Redux → UI (real-time format)
- [ ] Tool calls appear in correct order with other logs
- [ ] Duplicate detection works for tool calls
- [ ] History loading includes tool calls (history format with `parsed_output`)
- [ ] History and real-time tool calls produce identical log structures
- [ ] Both formats (`agent_name`/`text` vs `author`/`parsed_output`) are handled correctly

### UI Tests

- [ ] Tool call logs render correctly
- [ ] Display names are formatted properly
- [ ] Timestamps display correctly
- [ ] Responsive design works on mobile/desktop
- [ ] Matches design reference

## Edge Cases & Considerations

### 1. Unknown Tool Call Agents

- **Solution:** Use `getToolCallAgentDisplayName()` to format unknown agents
- **Fallback:** Display formatted agent name (e.g., "topic_checker_agent" → "Topic Checker Agent")

### 2. Missing Fields

- **Solution:** Provide defaults for `text`, `timestamp`, etc.
- **Validation:** Log warnings for missing required fields

### 3. Duplicate Tool Calls

- **Solution:** Existing duplicate detection should work (by ID or author+timestamp)
- **Note:** Tool calls from same agent at different times are valid

### 4. History vs Real-Time Consistency

- **Challenge:** History uses `parsed_output` (string) while real-time uses `text` field
- **Solution:**
  - History parser extracts text from `parsed_output` string
  - Real-time parser uses `text` field
  - Both normalize to same structure (`text` and `content` fields)
- **Verification:** Ensure both produce identical log structures
- **Note:** History tool calls have `parsed_output` as plain string (not JSON), which distinguishes them from other agents

### 5. Performance

- **Current:** Tool call logs are lightweight (no heavy data)
- **Optimization Opportunities:**
  - **Duplicate Detection:** Currently O(n) per log. Consider using Set/Map for O(1) lookup when logs exceed 50 entries
  - **Display Name Generation:** Memoize `getToolCallAgentDisplayName()` to avoid repeated string operations
  - **Log Size Limits:** Implement configurable limits (e.g., 500 logs) to prevent unbounded memory growth
  - See `TOOL_CALL_PRODUCTION_REVIEW.md` for detailed optimization recommendations

## File Changes Summary

### New Files

1. `src/components/presentation/v2/logs/ToolCallLog.jsx` - UI component

### Modified Files

1. `src/utils/presentation/presentationDataParser.js` - Add `parseToolCall()`, update `parseAgentOutput()`
2. `src/utils/presentation/messageTypeClassifier.js.js` - Add `TOOL_CALL` type, `getToolCallAgentDisplayName()`
3. `src/components/presentation/v2/logs/LogRouter.jsx` - Add tool call routing
4. `src/utils/presentation/presentationHistoryDataParser.js` - Add history parser support

### No Changes Needed

- `usePresentationSocket.js` - Already handles all `agent_output` events
- `usePresentationOrchestrator.js` - No changes needed
- Redux slice - Uses existing `addLog()` action

## Implementation Order

1. **Phase 1 & 2:** Parser and message type classification (foundation)
2. **Phase 3:** UI component (visual implementation)
3. **Phase 4:** Router integration (connect UI to system)
4. **Phase 5:** History parser (ensure consistency)
5. **Phase 6:** Testing and verification

## Success Criteria

✅ Tool call events are parsed correctly from socket  
✅ Tool calls appear in UI with proper formatting  
✅ Display names are user-friendly  
✅ History loading includes tool calls  
✅ No duplicate tool calls in logs  
✅ Consistent behavior across real-time and history  
✅ Matches design reference  
✅ Production-ready error handling

## Production Optimizations

For production-grade implementation, see `TOOL_CALL_PRODUCTION_REVIEW.md` for detailed analysis.

### Critical Optimizations (Recommended for Production)

1. **Log Size Limits**
   - Implement configurable maximum log count (e.g., 500 logs)
   - Prevents unbounded memory growth
   - Use `slice(-MAX_LOGS)` to keep most recent logs

2. **Duplicate Detection Optimization**
   - Current: O(n) linear search per log
   - Optimized: O(1) using Set/Map for log IDs
   - Significant performance improvement for presentations with 50+ logs

3. **Display Name Memoization**
   - Cache computed display names
   - Avoids repeated string operations
   - Minimal memory overhead

4. **Error Boundaries**
   - Add try-catch in UI components
   - Graceful fallback rendering
   - Prevents UI crashes from parser errors

### Performance Impact

- **Current:** O(n²) worst case for duplicate detection
- **Optimized:** O(n) with Set-based lookup
- **Memory:** Bounded with log limits vs unbounded

## Future Enhancements

- Add tool call status indicators (pending, in-progress, completed)
- Support for tool call results/outputs
- Grouping related tool calls
- Analytics tracking for tool call usage
- Performance monitoring and metrics
