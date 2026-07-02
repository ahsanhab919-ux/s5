# Phase 1: MVP Implementation

**Duration:** 3-4 days  
**Priority:** 🟡 HIGH - Core functionality  
**Goal:** Background uploads with persistent state and basic notifications

---

## Overview

This phase implements the core UX improvement: allowing users to minimize the upload modal and continue working while files upload in the background, with clear feedback on progress and completion.

**Prerequisites:** Phase 0 must be completed

---

## Architecture Overview

```
┌─────────────────────────────────────────────┐
│         Redux Store (Source of Truth)       │
│  - Upload queue with file status            │
│  - UI state (minimized, notifications)      │
└─────────────────────────────────────────────┘
                    ↕
┌─────────────────────────────────────────────┐
│         Components Layer                     │
│  - MultipleFileUpload (main modal)          │
│  - UploadProgressIndicator (floating badge) │
│  - FileHistorySidebar (existing)            │
└─────────────────────────────────────────────┘
                    ↕
┌─────────────────────────────────────────────┐
│         Services Layer                       │
│  - uploadService.js (API calls)             │
│  - toastService.js (notifications)          │
└─────────────────────────────────────────────┘
```

---

## Step 1: Redux State Management

### 1.1 Create Upload Queue Slice

**File:** `src/redux/slices/uploadQueueSlice.js`

```javascript
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  files: [], // Array of upload items
  isModalOpen: false,
  stats: {
    total: 0,
    uploading: 0,
    completed: 0,
    failed: 0,
  },
};

const uploadQueueSlice = createSlice({
  name: "uploadQueue",
  initialState,
  reducers: {
    // Add files to queue
    addFiles: (state, action) => {
      const newFiles = action.payload.map((file) => ({
        id: file.id,
        fileName: file.fileName,
        fileSize: file.fileSize,
        status: "idle", // idle | uploading | success | error
        progress: 0,
        downloadUrl: null,
        error: null,
        timestamp: Date.now(),
        // Paraphrase settings
        mode: file.mode,
        synonym: file.synonym,
        language: file.language,
        freezeWords: file.freezeWords || [],
      }));

      state.files.push(...newFiles);
      state.stats.total += newFiles.length;
    },

    // Update single file status
    updateFileStatus: (state, action) => {
      const { id, status, progress, downloadUrl, error } = action.payload;
      const file = state.files.find((f) => f.id === id);

      if (file) {
        const oldStatus = file.status;

        file.status = status;
        if (progress !== undefined) file.progress = progress;
        if (downloadUrl !== undefined) file.downloadUrl = downloadUrl;
        if (error !== undefined) file.error = error;

        // Update stats
        if (oldStatus !== status) {
          if (oldStatus === "uploading") state.stats.uploading--;
          if (oldStatus === "failed") state.stats.failed--;

          if (status === "uploading") state.stats.uploading++;
          if (status === "success") state.stats.completed++;
          if (status === "error") state.stats.failed++;
        }
      }
    },

    // Remove file from queue
    removeFile: (state, action) => {
      const id = action.payload;
      const fileIndex = state.files.findIndex((f) => f.id === id);

      if (fileIndex !== -1) {
        const file = state.files[fileIndex];
        state.files.splice(fileIndex, 1);
        state.stats.total--;

        if (file.status === "uploading") state.stats.uploading--;
        if (file.status === "success") state.stats.completed--;
        if (file.status === "error") state.stats.failed--;
      }
    },

    // Clear completed files
    clearCompleted: (state) => {
      const completedCount = state.files.filter(
        (f) => f.status === "success",
      ).length;
      state.files = state.files.filter((f) => f.status !== "success");
      state.stats.completed -= completedCount;
      state.stats.total -= completedCount;
    },

    // Clear failed files
    clearFailed: (state) => {
      const failedCount = state.files.filter(
        (f) => f.status === "error",
      ).length;
      state.files = state.files.filter((f) => f.status !== "error");
      state.stats.failed -= failedCount;
      state.stats.total -= failedCount;
    },

    // Clear all files
    clearAll: (state) => {
      state.files = [];
      state.stats = {
        total: 0,
        uploading: 0,
        completed: 0,
        failed: 0,
      };
    },

    // Modal control
    setModalOpen: (state, action) => {
      state.isModalOpen = action.payload;
    },
  },
});

export const {
  addFiles,
  updateFileStatus,
  removeFile,
  clearCompleted,
  clearFailed,
  clearAll,
  setModalOpen,
} = uploadQueueSlice.actions;

// Selectors
export const selectAllFiles = (state) => state.uploadQueue.files;
export const selectUploadStats = (state) => state.uploadQueue.stats;
export const selectIsModalOpen = (state) => state.uploadQueue.isModalOpen;
export const selectActiveUploads = (state) =>
  state.uploadQueue.files.filter((f) => f.status === "uploading");
export const selectHasActiveUploads = (state) =>
  state.uploadQueue.files.some((f) => f.status === "uploading");
export const selectCompletedUploads = (state) =>
  state.uploadQueue.files.filter((f) => f.status === "success");

export default uploadQueueSlice.reducer;
```

### 1.2 Register Slice in Store

**File:** `src/redux/store.js` (or wherever your store is configured)

```javascript
import { configureStore } from "@reduxjs/toolkit";
import uploadQueueReducer from "./slices/uploadQueueSlice";
// ... other reducers

export const store = configureStore({
  reducer: {
    // ... existing reducers
    uploadQueue: uploadQueueReducer,
  },
});
```

**Testing:**

- [ ] Dispatch `addFiles` → files added to state
- [ ] Dispatch `updateFileStatus` → stats update correctly
- [ ] Dispatch `removeFile` → file removed, stats updated
- [ ] Selectors return correct data

---

## Step 2: Upload Service

### 2.1 Create Upload Service

**File:** `src/services/uploadService.js`

```javascript
import { parseUploadError } from "@/utils/uploadErrors";

class UploadService {
  constructor() {
    this.apiBase = `${process.env.NEXT_PUBLIC_API_URL}/p-v2/api`;
  }

  /**
   * Upload a single file with progress tracking
   */
  async uploadFile({
    file,
    mode,
    synonym,
    language,
    freezeWords = [],
    accessToken,
    onProgress,
  }) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("mode", mode?.toLowerCase() ?? "");
    formData.append("synonym", synonym?.toLowerCase() ?? "");
    formData.append("freeze", freezeWords);
    formData.append("language", language ?? "");

    try {
      const response = await fetch(`${this.apiBase}/files/file-paraphrase`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await parseUploadError(response);
        throw error;
      }

      const blob = await response.blob();
      return blob;
    } catch (error) {
      // Re-throw to be handled by caller
      throw error;
    }
  }

  /**
   * Check if user is authenticated
   */
  validateAuth(accessToken) {
    if (!accessToken) {
      throw new Error("Please log in to upload files");
    }
  }
}

export const uploadService = new UploadService();
```

**Design Pattern:** Singleton service for centralized upload logic

**Testing:**

- [ ] Mock fetch → successful upload returns blob
- [ ] Mock 401 error → throws appropriate error
- [ ] No token → throws auth error

---

## Step 3: Toast Notification Service

### 3.1 Create Toast Service

**File:** `src/services/toastService.js`

```javascript
import { toast } from "react-toastify";

class ToastService {
  /**
   * Show upload success notification
   */
  uploadSuccess(fileName, onViewHistory) {
    toast.success(
      <div>
        <div className="font-semibold">{fileName}</div>
        <div className="text-sm">File processed successfully!</div>
      </div>,
      {
        onClick: onViewHistory,
        autoClose: 5000,
      },
    );
  }

  /**
   * Show upload error notification
   */
  uploadError(fileName, errorMessage) {
    toast.error(
      <div>
        <div className="font-semibold">{fileName}</div>
        <div className="text-sm">{errorMessage}</div>
      </div>,
      {
        autoClose: 7000,
      },
    );
  }

  /**
   * Show batch completion notification
   */
  batchComplete(count, onViewHistory) {
    toast.success(
      <div>
        <div className="font-semibold">All files processed!</div>
        <div className="text-sm">{count} files ready to download</div>
      </div>,
      {
        onClick: onViewHistory,
        autoClose: 10000,
        closeOnClick: false,
      },
    );
  }

  /**
   * Show validation error
   */
  validationError(message) {
    toast.warning(message, {
      autoClose: 5000,
    });
  }

  /**
   * Show info message
   */
  info(message) {
    toast.info(message, {
      autoClose: 4000,
    });
  }
}

export const toastService = new ToastService();
```

**Testing:**

- [ ] Each toast type displays correctly
- [ ] Click handlers work
- [ ] Auto-close timers work

---

## Step 4: Update MultipleFileUpload Component

### 4.1 Refactor to Use Redux

**File:** `src/components/tools/common/MultipleFileUpload.jsx`

**Key Changes:**

```javascript
import { useDispatch, useSelector } from "react-redux";
import {
  addFiles,
  updateFileStatus,
  removeFile,
  clearCompleted,
  setModalOpen,
  selectAllFiles,
  selectUploadStats,
  selectIsModalOpen,
} from "@/redux/slices/uploadQueueSlice";
import { uploadService } from "@/services/uploadService";
import { toastService } from "@/services/toastService";
import {
  validateFile,
  sanitizeFileName,
  generateFileId,
} from "@/utils/fileValidation";
import { FileURLManager } from "@/utils/fileUploadHelpers";
import { UploadQueue } from "@/utils/uploadQueue";

export default function MultipleFileUpload({
  paidUser,
  selectedMode,
  selectedSynonymLevel,
  selectedLang,
  freezeWords = [],
  shouldShowButton = true,
}) {
  const dispatch = useDispatch();
  const { accessToken } = useSelector((state) => state.auth);

  // Get state from Redux
  const files = useSelector(selectAllFiles);
  const stats = useSelector(selectUploadStats);
  const isOpen = useSelector(selectIsModalOpen);

  const [popoverAnchorEl, setPopoverAnchorEl] = useState(null);

  // Managers
  const urlManager = useRef(new FileURLManager()).current;
  const uploadQueue = useRef(new UploadQueue(3)).current;
  const inputRef = useRef(null);

  const limit = paidUser ? PAID_LIMIT : FREE_LIMIT;

  // Cleanup on unmount
  useEffect(() => {
    return () => urlManager.revokeAll();
  }, []);

  const handleOpen = (event) => {
    if (paidUser) {
      dispatch(setModalOpen(true));
    } else {
      setPopoverAnchorEl(event.currentTarget);
    }
  };

  const handleClose = () => {
    dispatch(setModalOpen(false));
    // Don't clear files - they persist in Redux
  };

  const handleFilesSelected = async (fileList) => {
    const incoming = Array.from(fileList).slice(0, limit);

    // Validate auth
    try {
      uploadService.validateAuth(accessToken);
    } catch (err) {
      toastService.validationError(err.message);
      return;
    }

    // Validate and prepare files
    const preparedFiles = await Promise.all(
      incoming.map(async (file) => {
        const validation = await validateFile(file);
        const id = generateFileId(file);

        if (!validation.valid) {
          return {
            id,
            fileName: file.name,
            fileSize: file.size,
            status: "error",
            error: validation.errors[0],
            file, // Keep reference for retry
          };
        }

        return {
          id,
          fileName: sanitizeFileName(file.name),
          fileSize: file.size,
          status: "idle",
          mode: selectedMode,
          synonym: selectedSynonymLevel,
          language: selectedLang,
          freezeWords,
          file, // Keep file reference for upload
        };
      }),
    );

    // Add to Redux
    dispatch(addFiles(preparedFiles));

    // Start uploads for valid files
    preparedFiles.forEach((fileItem) => {
      if (fileItem.status === "idle") {
        uploadQueue.add(() => uploadFile(fileItem));
      }
    });
  };

  const uploadFile = async (fileItem) => {
    const { id, file, mode, synonym, language, freezeWords } = fileItem;

    // Set status to uploading
    dispatch(updateFileStatus({ id, status: "uploading", progress: 0 }));

    try {
      const blob = await uploadService.uploadFile({
        file,
        mode,
        synonym,
        language,
        freezeWords,
        accessToken,
      });

      // Create download URL
      const url = urlManager.create(blob);

      // Update to success
      dispatch(
        updateFileStatus({
          id,
          status: "success",
          progress: 100,
          downloadUrl: url,
        }),
      );

      // Show success toast
      toastService.uploadSuccess(fileItem.fileName, () => {
        // Open file history sidebar
        dispatch(toggleUpdateFileHistory());
      });

      // Update file history
      dispatch(toggleUpdateFileHistory());
    } catch (err) {
      // Update to error
      dispatch(
        updateFileStatus({
          id,
          status: "error",
          progress: 0,
          error: err.message,
        }),
      );

      // Show error toast
      toastService.uploadError(fileItem.fileName, err.message);
    }
  };

  const handleDownload = (file) => {
    if (file.downloadUrl) {
      const link = document.createElement("a");
      link.href = file.downloadUrl;
      link.download = file.fileName;
      link.click();
    }
  };

  const handleRemoveFile = (fileId) => {
    const file = files.find((f) => f.id === fileId);
    if (file?.downloadUrl) {
      urlManager.revoke(file.downloadUrl);
    }
    dispatch(removeFile(fileId));
  };

  const handleClearCompleted = () => {
    // Revoke URLs for completed files
    files
      .filter((f) => f.status === "success" && f.downloadUrl)
      .forEach((f) => urlManager.revoke(f.downloadUrl));

    dispatch(clearCompleted());
  };

  // Rest of the component JSX remains similar but uses Redux state
  return (
    <>
      <Button onClick={handleOpen} /* ... */>Multi Upload Document</Button>

      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Multiple Documents</DialogTitle>
          </DialogHeader>

          {/* Upload zone */}
          <div onClick={() => inputRef.current?.click()} /* ... */>
            {/* ... upload UI ... */}
            <input
              ref={inputRef}
              type="file"
              multiple
              accept=".pdf,.docx,.txt"
              hidden
              onChange={(e) => handleFilesSelected(e.target.files)}
            />
          </div>

          {/* File list */}
          <div className="space-y-2">
            {files.map((f) => (
              <div key={f.id} className="flex items-center gap-2">
                <div className="flex-1">
                  <div className="truncate text-sm font-medium">
                    {f.fileName}
                  </div>
                  <div className="text-muted-foreground text-xs">
                    {f.error || f.status === "success"
                      ? "Completed"
                      : f.status === "uploading"
                        ? "Uploading..."
                        : ""}
                  </div>
                </div>

                {/* Progress bar */}
                {(f.status === "uploading" || f.status === "success") && (
                  <Progress value={f.progress} className="w-20" />
                )}

                {/* Download button */}
                {f.status === "success" && f.downloadUrl && (
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleDownload(f)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                )}

                {/* Remove button */}
                {(f.status === "success" || f.status === "error") && (
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleRemoveFile(f.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          <DialogFooter>
            <div className="flex flex-1 items-center gap-2">
              <span className="text-muted-foreground text-xs">
                {stats.uploading > 0 && `${stats.uploading} uploading • `}
                {stats.completed} completed
                {stats.failed > 0 && ` • ${stats.failed} failed`}
              </span>
            </div>
            {stats.completed > 0 && (
              <Button variant="outline" onClick={handleClearCompleted}>
                Clear Completed
              </Button>
            )}
            <Button onClick={handleClose}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <UpgradePopover /* ... */ />
    </>
  );
}
```

**Testing:**

- [ ] Upload files → added to Redux state
- [ ] File status updates → Redux state updates
- [ ] Close modal → files persist
- [ ] Reopen modal → same files visible
- [ ] Download works
- [ ] Remove file works
- [ ] Clear completed works

---

## Step 5: Upload Progress Indicator

### 5.1 Create Floating Indicator Component

**File:** `src/components/tools/common/UploadProgressIndicator.jsx`

```javascript
"use client";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Upload, X, CheckCircle, AlertCircle } from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import {
  selectUploadStats,
  selectHasActiveUploads,
  selectAllFiles,
  setModalOpen,
  clearCompleted,
  selectIsModalOpen,
} from "@/redux/slices/uploadQueueSlice";
import { motion, AnimatePresence } from "framer-motion";

export default function UploadProgressIndicator() {
  const dispatch = useDispatch();
  const stats = useSelector(selectUploadStats);
  const hasActiveUploads = useSelector(selectHasActiveUploads);
  const files = useSelector(selectAllFiles);
  const isModalOpen = useSelector(selectIsModalOpen);

  // Calculate overall progress
  const overallProgress =
    stats.total > 0
      ? ((stats.completed + stats.failed) / stats.total) * 100
      : 0;

  // Don't show if modal is open or no files
  const shouldShow = !isModalOpen && stats.total > 0;

  const handleClick = () => {
    dispatch(setModalOpen(true));
  };

  const handleDismiss = (e) => {
    e.stopPropagation();
    if (!hasActiveUploads) {
      dispatch(clearCompleted());
    }
  };

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          className="fixed right-6 bottom-6 z-50"
        >
          <div
            onClick={handleClick}
            className="bg-card border-border cursor-pointer rounded-lg border p-4 shadow-lg transition-all hover:shadow-xl"
            style={{ minWidth: "280px" }}
          >
            {/* Header */}
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {hasActiveUploads ? (
                  <Upload className="text-primary h-5 w-5 animate-pulse" />
                ) : stats.failed > 0 ? (
                  <AlertCircle className="text-destructive h-5 w-5" />
                ) : (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                )}
                <span className="text-sm font-semibold">
                  {hasActiveUploads
                    ? "Uploading files..."
                    : stats.failed > 0
                      ? "Some uploads failed"
                      : "All files processed"}
                </span>
              </div>
              {!hasActiveUploads && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6"
                  onClick={handleDismiss}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Stats */}
            <div className="text-muted-foreground mb-2 text-xs">
              {stats.completed} completed
              {stats.uploading > 0 && ` • ${stats.uploading} uploading`}
              {stats.failed > 0 && ` • ${stats.failed} failed`}
            </div>

            {/* Progress bar */}
            <Progress value={overallProgress} className="h-2" />

            {/* Click to expand hint */}
            <div className="text-muted-foreground mt-2 text-center text-xs">
              Click to {hasActiveUploads ? "view details" : "download files"}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

**Design Pattern:** Presentation component - receives all data via props/Redux, no business logic

**Testing:**

- [ ] Shows when files uploading and modal closed
- [ ] Hides when modal open
- [ ] Progress bar updates correctly
- [ ] Click opens modal
- [ ] Dismiss removes completed files
- [ ] Animation smooth

---

### 5.2 Add Indicator to Layout

**File:** `src/app/layout.jsx` or where global components are mounted

```javascript
import UploadProgressIndicator from "@/components/tools/common/UploadProgressIndicator";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <UploadProgressIndicator />
        {/* Other global components */}
      </body>
    </html>
  );
}
```

---

## Step 6: Batch Completion Detection

### 6.1 Add Completion Hook

**File:** `src/hooks/useUploadCompletion.js`

```javascript
import { useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  selectUploadStats,
  selectHasActiveUploads,
} from "@/redux/slices/uploadQueueSlice";
import { toastService } from "@/services/toastService";
import { toggleUpdateFileHistory } from "@/redux/slices/paraphraseHistorySlice";

export const useUploadCompletion = () => {
  const dispatch = useDispatch();
  const stats = useSelector(selectUploadStats);
  const hasActiveUploads = useSelector(selectHasActiveUploads);
  const prevHadActiveUploads = useRef(false);

  useEffect(() => {
    // Batch just completed
    if (
      prevHadActiveUploads.current &&
      !hasActiveUploads &&
      stats.completed > 0
    ) {
      toastService.batchComplete(stats.completed, () => {
        // Open file history when toast clicked
        dispatch(toggleUpdateFileHistory());
      });
    }

    prevHadActiveUploads.current = hasActiveUploads;
  }, [hasActiveUploads, stats.completed, dispatch]);
};
```

**Usage in MultipleFileUpload:**

```javascript
import { useUploadCompletion } from "@/hooks/useUploadCompletion";

export default function MultipleFileUpload(props) {
  // ... existing code ...

  // Add this hook
  useUploadCompletion();

  // ... rest of component ...
}
```

**Testing:**

- [ ] Upload 5 files → completion toast shows when all done
- [ ] Click toast → opens file history
- [ ] Multiple batches → toast for each batch

---

## Step 7: Configure React Toastify

### 7.1 Setup Toast Container

**File:** `src/app/layout.jsx`

```javascript
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <ToastContainer
          position="bottom-left"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light" // or use theme from your app context
        />
        <UploadProgressIndicator />
      </body>
    </html>
  );
}
```

---

## Files Created/Modified

### New Files

```
docs/
  file-upload/
    PHASE1_MVP_IMPLEMENTATION.md           [THIS FILE]

src/
  redux/
    slices/
      uploadQueueSlice.js                   [NEW]

  services/
    uploadService.js                        [NEW]
    toastService.js                         [NEW]

  components/
    tools/
      common/
        UploadProgressIndicator.jsx         [NEW]

  hooks/
    useUploadCompletion.js                  [NEW]
```

### Modified Files

```
src/
  redux/
    store.js                                [MODIFY - add slice]

  components/
    tools/
      common/
        MultipleFileUpload.jsx              [MODIFY - Redux integration]

  app/
    layout.jsx                              [MODIFY - add components]
```

---

## Integration Testing

### Test Scenarios

1. **Happy Path**
   - [ ] User uploads 10 files
   - [ ] Closes modal
   - [ ] Sees progress indicator
   - [ ] All files complete
   - [ ] Gets completion toast
   - [ ] Opens history from toast
   - [ ] Downloads files

2. **Mixed Results**
   - [ ] Upload 5 valid + 2 invalid files
   - [ ] Invalid files show error immediately
   - [ ] Valid files upload
   - [ ] Progress indicator shows correct stats
   - [ ] Can retry failed files

3. **Modal Persistence**
   - [ ] Upload files
   - [ ] Close modal
   - [ ] Navigate to different page
   - [ ] Come back
   - [ ] Reopen modal
   - [ ] Files still there

4. **Concurrent Batches**
   - [ ] Start batch 1
   - [ ] Close modal
   - [ ] Open and start batch 2
   - [ ] Both batches tracked correctly

---

## Success Criteria

- [ ] All files tracked in Redux
- [ ] Modal can be closed without losing state
- [ ] Progress indicator shows when modal closed
- [ ] Toasts show for success/error/completion
- [ ] Click indicator opens modal
- [ ] Files can be downloaded
- [ ] Completed files can be cleared
- [ ] No memory leaks
- [ ] Max 3 concurrent uploads
- [ ] All Phase 0 fixes still working

---

## Design Patterns Used

1. **Redux Pattern** - Centralized state management
2. **Service Layer** - Separation of concerns (API, toasts)
3. **Custom Hooks** - Reusable logic (useUploadCompletion)
4. **Singleton Services** - Single instances for uploadService, toastService
5. **Selector Pattern** - Derived state from Redux
6. **Manager Pattern** - FileURLManager, UploadQueue

---

## Estimated Time

- Redux slice: 3 hours
- Services: 2 hours
- Component refactor: 4 hours
- Progress indicator: 3 hours
- Completion hook: 1 hour
- Integration: 2 hours
- Testing: 4 hours

**Total: 19-20 hours**

---

## Next Phase

After completing Phase 1 MVP, proceed to Phase 2 for production hardening (retry logic, real progress tracking, persistence).
