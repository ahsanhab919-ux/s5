# Presentation System Data Flow Analysis

## Overview

This document provides a comprehensive analysis of the data flow in the presentation generation system, focusing on how `PresentationAgentPageV2.jsx`, `usePresentationSocket.js`, and `usePresentationOrchestrator.js` work together to manage real-time streaming, history loading, and state synchronization.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│              PresentationAgentPageV2.jsx                       │
│  - Main UI Component                                           │
│  - Renders logs and preview panels                             │
│  - Handles follow-up queries                                    │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        │ Uses
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│         usePresentationOrchestrator.js                          │
│  - Lifecycle Management                                         │
│  - Status Routing (queued/processing/completed/failed)         │
│  - History Loading (for completed/processing)                   │
│  - Socket Connection Control                                    │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        │ Controls
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│            usePresentationSocket.js                             │
│  - WebSocket Connection Management                              │
│  - Real-time Message Processing                                 │
│  - Message Buffering & Sequential Processing                    │
│  - Duplicate Detection                                          │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        │ Dispatches to
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│              Redux Store (presentationSlice)                    │
│  - logs: [] (agent outputs, user messages)                     │
│  - slides: [] (generated slides)                                │
│  - status, presentationStatus                                   │
│  - metadata (title, totalSlides)                                │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow Phases

### Phase 1: Initialization

**Entry Point: `PresentationAgentPageV2.jsx`**

1. Component mounts with `presentationId`
2. Calls `usePresentationOrchestrator(presentationId)`

**Orchestrator Initialization (`usePresentationOrchestrator.js`)**

```javascript
// Line 473-517: initialize()
1. Checks if already initialized for this presentationId
2. Sets hookStatus to "checking"
3. Fetches presentation status from API: GET /presentation-status/{pId}
4. Routes to appropriate handler based on status
```

**Status Routing:**

- **QUEUED** → `handleQueuedStatus()` → Starts presentation + connects socket
- **PROCESSING** → `handleProcessingStatus()` → Loads history first, then connects socket
- **COMPLETED** → `handleCompletedStatus()` → Loads history only (no socket)
- **FAILED** → `handleFailedStatus()` → Sets error state

### Phase 2: History Loading (for PROCESSING/COMPLETED)

**When Status is PROCESSING or COMPLETED:**

```javascript
// usePresentationOrchestrator.js:146-208
fetchPresentationHistory(pId) {
  1. Fetches: GET /logs?p_id={pId}
  2. Imports presentationHistoryDataParser dynamically
  3. Parses raw history data using parseHistoryData()
  4. Validates parsed data
  5. Dispatches setHistoryData() to Redux
}
```

**History Parser (`presentationHistoryDataParser.js`)**

```javascript
// Line 506-584: parseHistoryData()
1. Processes logs array:
   - Parses each log entry by author type
   - Aggregates browser_worker logs (multiple entries → single log)
   - Extracts metadata from presentation_spec_extractor_agent

2. Processes slides array:
   - Parses slide data (thinking, htmlContent, slideNumber)
   - Sorts by slideNumber

3. Returns structured state:
   {
     logs: [...],      // Parsed log entries
     slides: [...],    // Parsed slide entries
     status: "...",    // Presentation status
     _replaceArrays: true  // Flag for Redux to replace, not append
   }
```

**Redux Action: `setHistoryData()`**

```javascript
// presentationSlice.js:37-62
- Replaces entire logs array
- Replaces entire slides array
- Updates status and metadata
- Uses _replaceArrays flag to ensure clean state
```

### Phase 3: Socket Connection (for QUEUED/PROCESSING)

**Socket Initialization (`usePresentationSocket.js`)**

```javascript
// Line 357-496: useEffect for socket connection
1. Creates socket.io connection with:
   - Path: /slide/socket.io
   - Query params: p_id, token
   - Auto-reconnect enabled

2. Sets up event listeners:
   - "connect" → Sets status to "streaming"
   - "connected" → Parses session data
   - "agent_output" → Processes real-time messages
   - "disconnect" → Handles disconnection
```

**Connection Control Logic:**

```javascript
// usePresentationOrchestrator.js:78-82
shouldConnectSocket =
  presentationStatus === "processing" ||
  presentationStatus === "queued" ||
  currentStatusRef.current === "processing" ||
  currentStatusRef.current === "queued";

// Socket hook receives pId only when shouldConnectSocket is true
usePresentationSocket(shouldConnectSocket ? currentPId : null, token);
```

### Phase 4: Real-Time Message Processing

**Message Reception (`usePresentationSocket.js`)**

```javascript
// Line 418-463: "agent_output" event handler
socket.on("agent_output", (message) => {
  1. Checks for terminal/completion events
  2. If terminal → Dispatches status update and disconnects
  3. Otherwise → Buffers message and processes
})
```

**Message Buffering & Sequential Processing:**

```javascript
// Line 329-351: processBuffer()
- Uses messageBufferRef to queue messages
- Uses isProcessingRef to prevent concurrent processing
- Processes messages one at a time sequentially
- Prevents race conditions in Redux updates
```

**Message Parsing (`usePresentationSocket.js` + `presentationDataParser.js`)**

```javascript
// Line 54-323: processAgentOutputMessage()
1. Calls parseAgentOutput(message, currentState)
   - Routes by author type:
     * "user" → parseUserMessage()
     * "presentation_spec_extractor_agent" → parsePresentationSpecExtractor()
     * "KeywordResearchAgent" → parseKeywordResearchAgent()
     * "browser_worker_*" → parseBrowserWorker()
     * "enhanced_slide_generator_*" → parseEnhancedSlideGenerator()
     * etc.

2. Returns parsed structure:
   {
     type: "log" | "log_with_metadata" | "browser_worker" | "slide",
     data/logEntry/slideEntry: {...},
     updateType: "create" | "update",
     logIndex/slideIndex: number
   }
```

**Duplicate Detection:**

```javascript
// usePresentationSocket.js:82-173
Multiple layers of duplicate prevention:

1. User Messages:
   - Checks for optimistic temp logs (from UI)
   - Replaces temp log with backend log
   - Checks for duplicate content within 5 seconds

2. Browser Workers:
   - Checks if worker already exists
   - Updates existing instead of creating duplicate

3. General Logs:
   - Checks by ID
   - Checks by author + timestamp

4. Slides:
   - Checks if slide exists by slideNumber
   - Updates existing instead of creating duplicate
```

**Redux Updates:**

```javascript
// Based on parsed type:
switch (parsed.type) {
  case "log":
    dispatch(addLog(parsed.data));
    break;

  case "log_with_metadata":
    dispatch(addLog(parsed.data));
    dispatch(setMetadata(parsed.metadata));
    break;

  case "browser_worker":
    if (parsed.updateType === "update") {
      dispatch(updateLog({ logIndex, logEntry }));
    } else {
      dispatch(addLog(parsed.logEntry));
    }
    break;

  case "slide":
    dispatch(
      updateSlide({
        type: parsed.updateType,
        slideIndex: parsed.slideIndex,
        slideEntry: parsed.slideEntry,
      }),
    );
    break;
}
```

### Phase 5: Simultaneous History + Real-Time Handling

**Critical: How History and Real-Time Data Coexist**

When status is **PROCESSING**, the system:

1. **First**: Loads history data

   ```javascript
   // usePresentationOrchestrator.js:295-347
   handleProcessingStatus() {
     // Step 1: Load history
     const historyData = await fetchPresentationHistory(pId)
     dispatch(setHistoryData(historyData))  // Replaces arrays

     // Step 2: Connect socket for real-time updates
     setHookStatus(HOOK_STATUS.STREAMING)
     // Socket connects automatically via usePresentationSocket
   }
   ```

2. **Then**: Socket connects and starts receiving real-time updates

   ```javascript
   // usePresentationSocket.js:406-410
   socket.on("connect", () => {
     dispatch(setStatus({ status: "streaming" }));
     processBuffer(); // Process any buffered messages
   });
   ```

3. **Real-time messages append/update** on top of history:
   - History data uses `_replaceArrays: true` → Replaces entire arrays
   - Real-time messages use `addLog()` / `updateLog()` → Appends/updates
   - Browser workers from history are updated incrementally via socket
   - Slides from history are updated incrementally via socket

**State Synchronization:**

```javascript
// usePresentationSocket.js:42-49
// Uses ref to avoid stale closures
const presentationStateRef = useRef(null);

useEffect(() => {
  presentationStateRef.current = presentation;
}, [presentation]);

// When processing messages, uses ref for current state
const currentState = presentationStateRef.current;
const parsed = parseAgentOutput(message, currentState);
```

### Phase 6: Completion Handling

**Terminal Event Detection:**

```javascript
// usePresentationSocket.js:427-458
const isTerminalEvent =
  message.author === "terminal" ||
  message.type === "terminal" ||
  message.event === "completed" ||
  (message.status === "completed" && message.author === "terminal");

if (isTerminalEvent) {
  const terminalData = parseTerminalEvent(message);
  dispatch(
    setStatus({
      status: "completed",
      presentationStatus: "completed",
    }),
  );

  // Disconnect socket after 500ms delay
  setTimeout(() => socket.disconnect(), 500);
}
```

**Orchestrator Status Sync:**

```javascript
// usePresentationOrchestrator.js:631-707
// Watches Redux status changes
useEffect(() => {
  if (reduxStatus === "completed") {
    setHookStatus(HOOK_STATUS.READY);
    // Socket disconnects automatically
  }
}, [presentationState.presentationStatus]);
```

## Key Design Patterns

### 1. **Message Buffering**

- Prevents race conditions
- Ensures sequential processing
- Handles connection timing issues

### 2. **Duplicate Prevention**

- Multiple layers (socket level, Redux level)
- Content-based matching for user messages
- Author-based matching for browser workers
- ID + timestamp matching for general logs

### 3. **State Reference Pattern**

- Uses `useRef` to avoid stale closures
- Updates ref on every state change
- Uses ref when processing messages

### 4. **History + Real-Time Merge**

- History replaces arrays (clean slate)
- Real-time appends/updates incrementally
- Browser workers and slides update existing entries

### 5. **Status-Based Routing**

- Orchestrator routes by presentation status
- Different handlers for different states
- Socket only connects when needed

## Data Structures

### Log Entry Structure

```typescript
{
  id: string                    // Unique identifier
  author: string                 // Agent name or "user"
  timestamp: string              // ISO timestamp
  phase: string                  // "planning" | "research" | "generation"

  // User messages
  user_message?: string
  content?: string
  text?: string

  // Browser workers
  workerNumber?: number
  links?: Array<{ domain, url, timestamp }>
  summary?: string
  lastUpdated?: string

  // Keyword research
  keywords?: string[]

  // Presentation spec
  colorTheme?: string
  tags?: string[]

  // Metadata
  messageType?: string           // From enrichLogEntry()
  temp?: boolean                 // Optimistic log flag
}
```

### Slide Entry Structure

```typescript
{
  slideNumber: number
  thinking?: string              // Agent thinking process
  htmlContent?: string           // Rendered HTML
  isComplete: boolean
  timestamp: string
  lastUpdated?: string
}
```

## Error Handling

1. **Socket Connection Errors**
   - Auto-reconnect with exponential backoff
   - Handles disconnection gracefully

2. **Parsing Errors**
   - Try-catch around message processing
   - Logs errors without crashing
   - Continues processing other messages

3. **API Errors**
   - Status fetch failures → Sets error state
   - History fetch failures → Logs warning, continues with socket

4. **Duplicate Handling**
   - Multiple checks prevent duplicate entries
   - Logs skipped duplicates for debugging

## Performance Optimizations

1. **Sequential Message Processing**
   - Prevents Redux update conflicts
   - Ensures consistent state

2. **Ref-Based State Access**
   - Avoids unnecessary re-renders
   - Prevents stale closure issues

3. **Dynamic Imports**
   - History parser loaded only when needed
   - Reduces initial bundle size

4. **Message Buffering**
   - Handles connection timing
   - Processes messages in order

## Follow-Up Query Flow

When user sends a follow-up query:

```javascript
// PresentationAgentPageV2.jsx:59-88
handleFollowUp(message, fileUrls) {
  1. Gets current pId from Redux state
  2. Calls handleFollowUpQuery() utility
  3. Backend returns queued status
  4. Orchestrator detects status change
  5. Calls handleFollowUpQueued()
  6. Starts presentation (skipDuplicateCheck: true)
  7. Socket reconnects automatically
  8. Real-time updates resume
}
```

## Summary

The system elegantly handles:

1. **Multiple data sources**: History API + Real-time socket
2. **State synchronization**: Redux as single source of truth
3. **Duplicate prevention**: Multiple layers of checks
4. **Connection management**: Status-based socket control
5. **Incremental updates**: Browser workers and slides update incrementally
6. **Error resilience**: Graceful error handling throughout

The architecture ensures that history data and real-time updates coexist seamlessly, with history providing the foundation and real-time updates building on top of it.
