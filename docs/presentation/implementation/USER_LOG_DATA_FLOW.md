# User Log Data Flow Analysis

## Overview

This document traces how user messages flow from history API → Redux → UI, comparing with real-time socket flow.

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│              History API Response                           │
│  {                                                          │
│    logs: [                                                  │
│      {                                                      │
│        "author": "user",                                    │
│        "timestamp": "2025-11-20T04:46:18.643803+00:00",    │
│        "user_message": "Create a presentation about AI"     │
│      }                                                      │
│    ]                                                        │
│  }                                                          │
└───────────────────────┬───────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│    parseHistoryData()                                       │
│    presentationHistoryDataParser.js                         │
│                                                             │
│    - Loops through logs array                               │
│    - Routes to parseHistoryLogEntry()                       │
│    - For author === "user" → parseHistoryUserMessage()     │
└───────────────────────┬───────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│    parseHistoryUserMessage()                                │
│    Line 169-181                                             │
│                                                             │
│    Input: {                                                 │
│      author: "user",                                        │
│      timestamp: "...",                                      │
│      user_message: "Create a presentation about AI"         │
│    }                                                        │
│                                                             │
│    Output: {                                                │
│      id: "user_2025-11-20T04:46:18.643803+00:00_history",  │
│      author: "user",                                        │
│      content: "Create a presentation about AI",             │
│      timestamp: "2025-11-20T04:46:18.643803+00:00",        │
│      phase: "planning"                                      │
│    }                                                        │
│                                                             │
│    → enrichLogEntry() adds:                                 │
│      - messageType: "user"                                 │
│      - hasLinks, hasSummary, etc.                          │
└───────────────────────┬───────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│    setHistoryData() Action                                  │
│    Redux: presentationSlice.js                              │
│    Line 37-62                                               │
│                                                             │
│    - Replaces entire logs array                             │
│    - Uses _replaceArrays: true flag                         │
│    - Updates status and metadata                            │
└───────────────────────┬───────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│    Redux Store State                                        │
│    state.presentation.logs = [                             │
│      {                                                      │
│        id: "user_..._history",                             │
│        author: "user",                                      │
│        content: "Create a presentation about AI",           │
│        text: undefined,  // Not set in history              │
│        user_message: undefined,  // Not set in history      │
│        timestamp: "...",                                    │
│        phase: "planning",                                   │
│        messageType: "user"                                  │
│      }                                                      │
│    ]                                                        │
└───────────────────────┬───────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│    PresentationLogsUi Component                             │
│    Maps logs array → MessageBubble → LogRouter              │
└───────────────────────┬───────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│    LogRouter Component                                      │
│    Routes by messageType                                    │
│                                                             │
│    if (messageType === MESSAGE_TYPES.USER)                  │
│      return <UserMessageLog log={log} />                    │
└───────────────────────┬───────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│    UserMessageLog Component                                 │
│    Line 10-46                                               │
│                                                             │
│    Reads:                                                   │
│      - log?.content || log?.text                            │
│      - log?.timestamp || log?.lastUpdated                   │
│                                                             │
│    Renders:                                                 │
│      - Right-aligned chat bubble                            │
│      - "You" label with User icon                           │
│      - Timestamp                                            │
│      - Message content                                      │
└─────────────────────────────────────────────────────────────┘
```

## Detailed Implementation

### 1. History Parsing

**File:** `src/utils/presentation/presentationHistoryDataParser.js`

**Function:** `parseHistoryUserMessage()` (Line 169-181)

```javascript
const parseHistoryUserMessage = (logEntry) => {
  console.log("[HistoryParser] Parsing user message");

  const log = {
    id: generateHistoryLogId("user", logEntry.timestamp),
    author: "user",
    content: logEntry.user_message || logEntry.content || "",
    timestamp: logEntry.timestamp || new Date().toISOString(),
    phase: "planning",
  };

  return enrichLogEntry(log);
};
```

**Key Points:**

- Extracts `user_message` or `content` from history entry
- Generates ID with `_history` suffix
- Only sets `content` field (not `text` or `user_message`)
- Calls `enrichLogEntry()` to add `messageType: "user"`

**History Data Structure:**

```json
{
  "author": "user",
  "timestamp": "2025-11-20T04:46:18.643803+00:00",
  "user_message": "Create a presentation about AI"
}
```

### 2. Redux Storage

**File:** `src/redux/slices/presentationSlice.js`

**Action:** `setHistoryData()` (Line 37-62)

```javascript
setHistoryData(state, action) {
  const { logs, slides, status, title, totalSlides } = action.payload;

  console.log("[Redux] Setting history data:", action.payload);

  if (Array.isArray(logs)) {
    state.logs = logs;  // REPLACES entire array
  }

  if (Array.isArray(slides)) {
    state.slides = slides;  // REPLACES entire array
  }

  if (status) {
    state.status = status;
    state.presentationStatus = status;
  }

  if (title) {
    state.title = title;
  }

  if (totalSlides) {
    state.totalSlides = totalSlides;
  }
}
```

**Key Points:**

- **Replaces** entire logs array (not appends)
- Used when loading history via `_replaceArrays: true` flag
- Clears any existing logs before adding history

**Redux State Structure:**

```javascript
{
  logs: [
    {
      id: "user_2025-11-20T04:46:18.643803+00:00_history",
      author: "user",
      content: "Create a presentation about AI",
      timestamp: "2025-11-20T04:46:18.643803+00:00",
      phase: "planning",
      messageType: "user",
      // ... other enriched fields
    },
  ];
}
```

### 3. UI Display

**File:** `src/components/presentation/v2/logs/UserMessageLog.jsx`

**Component:** `UserMessageLog` (Line 10-46)

```jsx
export default function UserMessageLog({ log }) {
  const timeFormatter = new Intl.DateTimeFormat([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  const displayTime = log?.timestamp || log?.lastUpdated;
  const content = log?.content || log?.text || "";

  return (
    <div className="mb-6 flex justify-end">
      <div className="w-full sm:w-fit sm:max-w-[90%] lg:max-w-full">
        {/* Header with timestamp and user indicator */}
        <div className="mb-1.5 flex items-center justify-end gap-2 opacity-70">
          <span className="text-muted-foreground text-[11px]">
            {displayTime ? timeFormatter.format(new Date(displayTime)) : ""}
          </span>
          <span className="text-muted-foreground text-xs">You</span>
          <div className="bg-primary flex h-5 w-5 shrink-0 items-center justify-center rounded-full">
            <User className="text-primary-foreground h-3 w-3" />
          </div>
        </div>

        {/* Message bubble */}
        <div className="bg-primary rounded-t-[18px] rounded-br-[4px] rounded-bl-[18px] px-4 py-3 wrap-break-word">
          <span className="text-primary-foreground text-sm leading-[1.5] md:text-base">
            {content}
          </span>
        </div>
      </div>
    </div>
  );
}
```

**Key Points:**

- **Right-aligned** (user messages on right side)
- Reads `log?.content || log?.text` (fallback for compatibility)
- Displays timestamp, "You" label, and User icon
- Primary color bubble for user messages

## Comparison: History vs Real-Time

### History Flow

| Step         | Source                      | Field Used       | Value                            |
| ------------ | --------------------------- | ---------------- | -------------------------------- |
| API Response | History API                 | `user_message`   | "Create a presentation about AI" |
| Parser       | `parseHistoryUserMessage()` | `content`        | "Create a presentation about AI" |
| Redux        | `setHistoryData()`          | `logs[].content` | "Create a presentation about AI" |
| UI           | `UserMessageLog`            | `log?.content`   | "Create a presentation about AI" |

**Fields Set:**

- ✅ `content` - Set from `user_message`
- ❌ `text` - Not set
- ❌ `user_message` - Not set (only in history API, not in parsed log)

### Real-Time Flow

**File:** `src/utils/presentation/presentationDataParser.js`

**Function:** `parseUserMessage()` (Line 64-82)

```javascript
export const parseUserMessage = (message) => {
  console.log("[Parser] Parsing user message:", message);

  // Preserve user_message field for matching with optimistic logs
  const userMessageText = message.user_message || message.content || "";

  const logEntry = {
    id: generateLogId("user", message.timestamp),
    author: "user",
    user_message: userMessageText, // Preserve for matching
    content: userMessageText, // For UI display
    text: userMessageText, // Alternative field for UI
    timestamp: message.timestamp || new Date().toISOString(),
    phase: "planning",
  };

  return enrichLogEntry(logEntry);
};
```

**Real-Time Fields Set:**

- ✅ `user_message` - Preserved for duplicate matching
- ✅ `content` - For UI display
- ✅ `text` - Alternative field for UI

**Key Difference:**

- **Real-time:** Sets all three fields (`user_message`, `content`, `text`)
- **History:** Only sets `content` field

## Optimistic UI Handling

**File:** `src/components/agents/super-agent/agentPageUtils.js`

When user sends a message, an **optimistic log** is created:

```javascript
const localUserLog = enrichLogEntry({
  id: `local-user-${Date.now()}`,
  author: "user",
  type: "chunk",
  user_message: inputValue,
  content: inputValue, // For UI display
  text: inputValue, // Alternative field
  timestamp: new Date().toISOString(),
  p_id: currentPId,
  file_urls: fileUrlsForLog,
  temp: true, // Marked as temporary
});
dispatch(addLog(localUserLog));
```

**Socket Handler Replacement:**
When backend sends the real user message, the socket handler:

1. Finds the optimistic log by matching `user_message` content
2. Replaces it with the backend log (removes `temp: true`)
3. Uses `updateLog()` instead of `addLog()`

```javascript
// usePresentationSocket.js:95-121
const optimisticLogIndex = currentState.logs?.findIndex(
  (log) =>
    log.author === "user" &&
    log.temp === true &&
    (log.user_message === parsed.data.user_message ||
      log.content === parsed.data.user_message ||
      log.text === parsed.data.user_message),
);

if (optimisticLogIndex !== undefined && optimisticLogIndex !== -1) {
  dispatch(
    updateLog({
      logIndex: optimisticLogIndex,
      logEntry: enrichLogEntry({ ...parsed.data, temp: false }),
    }),
  );
  break; // Exit early, don't add as new log
}
```

## Redux Duplicate Detection

**File:** `src/redux/slices/presentationSlice.js`

**Action:** `addLog()` (Line 86-162)

For user messages, Redux has special duplicate detection:

```javascript
// Special check for user messages: prevent duplicates by content
if (
  logEntry.author === "user" &&
  log.author === "user" &&
  logEntry.user_message &&
  (log.user_message === logEntry.user_message ||
    log.content === logEntry.user_message ||
    log.text === logEntry.user_message) &&
  // Allow some time difference (within 10 seconds)
  Math.abs(
    new Date(log.timestamp).getTime() - new Date(logEntry.timestamp).getTime(),
  ) < 10000
) {
  console.log("[Redux] Duplicate user message detected by content");
  return true;
}
```

**Note:** This check requires `user_message` field, which history logs don't have. However, history logs are loaded via `setHistoryData()` which **replaces** the array, so duplicate detection isn't needed.

## Summary

### History User Logs

1. **API Format:**

   ```json
   {
     "author": "user",
     "user_message": "Create a presentation about AI",
     "timestamp": "2025-11-20T04:46:18.643803+00:00"
   }
   ```

2. **Parsed Format:**

   ```javascript
   {
     id: "user_2025-11-20T04:46:18.643803+00:00_history",
     author: "user",
     content: "Create a presentation about AI",  // Only this field
     timestamp: "2025-11-20T04:46:18.643803+00:00",
     phase: "planning",
     messageType: "user"
   }
   ```

3. **Redux Storage:**
   - Stored in `state.presentation.logs[]`
   - Replaces entire array when loading history
   - No duplicate detection needed (replacement, not append)

4. **UI Display:**
   - Right-aligned chat bubble
   - Shows "You" label with User icon
   - Displays timestamp and content
   - Uses `log?.content || log?.text` for compatibility

### Key Differences from Real-Time

| Aspect              | History                      | Real-Time                         |
| ------------------- | ---------------------------- | --------------------------------- |
| **Fields**          | Only `content`               | `user_message`, `content`, `text` |
| **ID Suffix**       | `_history`                   | `_${Date.now()}`                  |
| **Redux Action**    | `setHistoryData()` (replace) | `addLog()` (append)               |
| **Duplicate Check** | Not needed                   | By content + timestamp            |
| **Optimistic UI**   | No                           | Yes (temp logs)                   |

### UI Component Compatibility

The `UserMessageLog` component is compatible with both:

- **History logs:** Uses `log?.content` (set)
- **Real-time logs:** Uses `log?.content || log?.text` (both set)

This ensures consistent display regardless of source.
