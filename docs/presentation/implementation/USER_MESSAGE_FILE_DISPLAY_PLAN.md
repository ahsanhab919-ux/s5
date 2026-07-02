# User Message File Display Implementation Plan

## Overview

This document outlines the implementation plan for displaying attached files in user messages using the reusable `FileList` component. Files will be shown below the message bubble with read-only display (no remove functionality).

## Requirements

1. Display file names from `log.file_urls` array
2. Reuse existing `FileList` component
3. Show collapse/expand when more than 3 files
4. Read-only display (no remove functionality)
5. Match styling with message bubble alignment
6. Handle both history and real-time data formats

## Data Structure Analysis

### History Format

```json
{
  "file_urls": [
    {
      "name": "The Sundarban is the world's larges (3).txt",
      "url": "https://storage.googleapis.com/..."
    }
  ]
}
```

### Real-Time Format (from optimistic logs)

```javascript
{
  file_urls: [
    {
      name: "file.txt",
      url: "https://...",
    },
  ];
}
```

### FileList Expected Format

```javascript
{
  filename: "file.txt",
  signed_url: "https://...",  // or public_url
}
```

## Implementation Steps

### Step 1: Import FileList Component

**File:** `src/components/presentation/v2/logs/UserMessageLog.jsx`

**Action:**

- Add import statement for `FileList`
- Import `useMemo` from React for performance optimization

**Code:**

```jsx
import FileList from "@/components/common/FileList";
import { useMemo } from "react";
```

### Step 2: Create Data Transformation Function

**Location:** Inside `UserMessageLog` component

**Function Purpose:**

- Transform `file_urls` array to FileList format
- Handle edge cases (null, undefined, empty arrays)
- Map `name` → `filename` and `url` → `signed_url`

**Implementation:**

```javascript
const transformFileUrls = (fileUrls) => {
  if (!Array.isArray(fileUrls) || fileUrls.length === 0) {
    return [];
  }

  return fileUrls.map((file) => ({
    filename: file.name || file.filename || "Unknown file",
    signed_url: file.url || file.signed_url || file.public_url || null,
  }));
};
```

**Alternative:** Use `useMemo` for performance:

```javascript
const transformedFiles = useMemo(() => {
  const fileUrls = log?.file_urls;
  if (!Array.isArray(fileUrls) || fileUrls.length === 0) {
    return [];
  }

  return fileUrls.map((file) => ({
    filename: file.name || file.filename || "Unknown file",
    signed_url: file.url || file.signed_url || file.public_url || null,
  }));
}, [log?.file_urls]);
```

### Step 3: Add Conditional Rendering Logic

**Location:** Before return statement

**Logic:**

```javascript
const fileUrls = log?.file_urls;
const hasFiles = Array.isArray(fileUrls) && fileUrls.length > 0;
```

### Step 4: Integrate FileList Component

**Location:** After message bubble, before closing div

**Placement:**

```
┌─────────────────────────────────────┐
│  Header (timestamp + "You" + icon)  │
├─────────────────────────────────────┤
│  Message Bubble (content)           │
├─────────────────────────────────────┤
│  FileList (if hasFiles)             │ ← Add here
└─────────────────────────────────────┘
```

**JSX Structure:**

```jsx
{
  hasFiles && (
    <div className="mt-2">
      <FileList
        files={transformedFiles}
        maxVisibleFiles={3}
        title="Attached Files"
        showHeader={true}
        // onRemove not provided - no remove functionality
        // isUploading not needed - always false
      />
    </div>
  );
}
```

### Step 5: Styling Considerations

**Alignment:**

- FileList should align with message bubble
- Use same width constraints: `w-full sm:w-fit sm:max-w-[90%]`
- Ensure right alignment matches message bubble

**Spacing:**

- Add `mt-2` or `mt-3` between message and files
- Consider `mb-0` on FileList to control spacing

**Container:**

- FileList is already in the right-aligned container
- Should inherit alignment from parent

### Step 6: Remove Debug Console.log

**Action:**

- Remove `console.log(log, "log");` from component
- Clean up for production

## Complete Implementation Structure

```jsx
"use client";

import { User } from "lucide-react";
import FileList from "@/components/common/FileList";
import { useMemo } from "react";

export default function UserMessageLog({ log }) {
  const timeFormatter = new Intl.DateTimeFormat([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  const displayTime = log?.timestamp || log?.lastUpdated;
  const content = log?.content || log?.text || "";

  // Transform file URLs for FileList component
  const transformedFiles = useMemo(() => {
    const fileUrls = log?.file_urls;
    if (!Array.isArray(fileUrls) || fileUrls.length === 0) {
      return [];
    }

    return fileUrls.map((file) => ({
      filename: file.name || file.filename || "Unknown file",
      signed_url: file.url || file.signed_url || file.public_url || null,
    }));
  }, [log?.file_urls]);

  const hasFiles = transformedFiles.length > 0;

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

        {/* FileList - Display attached files */}
        {hasFiles && (
          <div className="mt-2">
            <FileList
              files={transformedFiles}
              maxVisibleFiles={3}
              title="Attached Files"
              showHeader={true}
              className=""
            />
          </div>
        )}
      </div>
    </div>
  );
}
```

## FileList Props Configuration

| Prop              | Value              | Reason                                |
| ----------------- | ------------------ | ------------------------------------- |
| `files`           | `transformedFiles` | Transformed file_urls array           |
| `maxVisibleFiles` | `3`                | Collapse after 3 files                |
| `title`           | `"Attached Files"` | Clear label                           |
| `showHeader`      | `true`             | Show count header                     |
| `onRemove`        | `undefined`        | No remove functionality               |
| `isUploading`     | `false`            | Always false (read-only)              |
| `className`       | `""`               | Additional spacing handled by wrapper |

## Edge Cases Handling

### 1. Empty/Null file_urls

```javascript
// Handled by useMemo - returns empty array
if (!Array.isArray(fileUrls) || fileUrls.length === 0) {
  return [];
}
```

### 2. Missing file name

```javascript
filename: file.name || file.filename || "Unknown file";
```

### 3. Missing URL

```javascript
signed_url: file.url || file.signed_url || file.public_url || null;
```

### 4. Different data formats

- History: `{name, url}`
- Real-time: `{name, url}` or `{filename, signed_url}`
- Transformation handles all formats

## Testing Checklist

### Unit Tests

- [ ] Component renders without files
- [ ] Component renders with 1 file
- [ ] Component renders with 3 files (no collapse)
- [ ] Component renders with 5 files (shows collapse)
- [ ] Transformation handles null file_urls
- [ ] Transformation handles missing name
- [ ] Transformation handles missing url
- [ ] Transformation handles both history and real-time formats

### Visual Tests

- [ ] Files align with message bubble
- [ ] Spacing between message and files is appropriate
- [ ] Collapse/expand works correctly
- [ ] FileList styling matches chat context
- [ ] Responsive behavior on mobile/desktop
- [ ] Long filenames truncate properly

### Integration Tests

- [ ] History logs with files display correctly
- [ ] Real-time logs with files display correctly
- [ ] Messages without files don't show FileList
- [ ] Multiple user messages with files work correctly

## Performance Considerations

1. **useMemo Optimization**
   - Prevents re-transformation on every render
   - Only recalculates when `log?.file_urls` changes
   - Minimal performance impact

2. **Conditional Rendering**
   - FileList only renders when files exist
   - No unnecessary DOM elements

3. **FileList Internal Optimization**
   - FileList already has internal optimizations
   - Collapse/expand state management
   - Efficient rendering for large file lists

## Styling Adjustments (If Needed)

### Potential Issues:

1. **FileList width** - May need to match message bubble width
2. **Right alignment** - FileList should align with message
3. **Color scheme** - May need to adjust for chat context

### Solutions:

```jsx
// Option 1: Constrain FileList width
<div className="mt-2 w-full sm:w-fit">
  <FileList ... />
</div>

// Option 2: Custom className
<FileList
  className="w-full sm:max-w-[90%]"
  ...
/>
```

## Implementation Order

1. ✅ **Step 1:** Add imports (FileList, useMemo)
2. ✅ **Step 2:** Create transformation function with useMemo
3. ✅ **Step 3:** Add conditional rendering logic
4. ✅ **Step 4:** Add FileList JSX below message bubble
5. ✅ **Step 5:** Remove debug console.log
6. ✅ **Step 6:** Test with various file counts
7. ✅ **Step 7:** Verify styling and alignment
8. ✅ **Step 8:** Test with history and real-time data

## Success Criteria

✅ Files display correctly from history data  
✅ Files display correctly from real-time data  
✅ FileList shows collapse when >3 files  
✅ No remove buttons appear  
✅ Alignment matches message bubble  
✅ Responsive on mobile and desktop  
✅ Handles edge cases gracefully  
✅ No console errors or warnings  
✅ Performance is acceptable

## Future Enhancements

- Add click handler to open/download files
- Show file size if available
- Add file type icons
- Support drag-and-drop for file viewing
- Add file preview functionality
