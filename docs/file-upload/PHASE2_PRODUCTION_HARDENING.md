# Phase 2: Production Hardening

**Duration:** 4-5 days  
**Priority:** 🟡 HIGH - Production reliability  
**Goal:** Add retry logic, real progress tracking, persistence, and network resilience

---

## Overview

This phase makes the upload system production-ready by handling real-world scenarios: network failures, slow connections, page refreshes, and server errors.

**Prerequisites:** Phase 0 and Phase 1 must be completed

---

## Step 1: Real Progress Tracking

### Problem

Current implementation shows 0% → 100% instantly. Users can't see real upload progress, especially for large files.

### Solution: XMLHttpRequest with Progress Events

### 1.1 Update Upload Service

**File:** `src/services/uploadService.js`

```javascript
import { parseUploadError } from "@/utils/uploadErrors";

class UploadService {
  constructor() {
    this.apiBase = `${process.env.NEXT_PUBLIC_API_URL}/p-v2/api`;
    this.activeRequests = new Map(); // Track active XHR for cancellation
  }

  /**
   * Upload file with real progress tracking
   * @param {Object} params - Upload parameters
   * @param {Function} onProgress - Progress callback (percent: number)
   * @returns {Promise<Blob>} - Processed file blob
   */
  uploadFile({
    file,
    mode,
    synonym,
    language,
    freezeWords = [],
    accessToken,
    fileId,
    onProgress,
  }) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      // Store for potential cancellation
      this.activeRequests.set(fileId, xhr);

      // Track upload progress
      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable && onProgress) {
          const percentComplete = Math.round((e.loaded / e.total) * 100);
          onProgress(percentComplete);
        }
      });

      // Handle completion
      xhr.addEventListener("load", () => {
        this.activeRequests.delete(fileId);

        if (xhr.status >= 200 && xhr.status < 300) {
          const blob = xhr.response;
          resolve(blob);
        } else {
          parseUploadError({
            status: xhr.status,
            json: async () => {
              try {
                return JSON.parse(xhr.responseText);
              } catch {
                return {};
              }
            },
          }).then(reject);
        }
      });

      // Handle errors
      xhr.addEventListener("error", () => {
        this.activeRequests.delete(fileId);
        reject(
          new Error("Network error occurred. Please check your connection."),
        );
      });

      // Handle abort
      xhr.addEventListener("abort", () => {
        this.activeRequests.delete(fileId);
        reject(new Error("Upload cancelled"));
      });

      // Handle timeout
      xhr.addEventListener("timeout", () => {
        this.activeRequests.delete(fileId);
        reject(new Error("Upload timed out. Please try again."));
      });

      // Prepare request
      const formData = new FormData();
      formData.append("file", file);
      formData.append("mode", mode?.toLowerCase() ?? "");
      formData.append("synonym", synonym?.toLowerCase() ?? "");
      formData.append("freeze", freezeWords);
      formData.append("language", language ?? "");

      // Configure request
      xhr.open("POST", `${this.apiBase}/files/file-paraphrase`);
      xhr.setRequestHeader("Authorization", `Bearer ${accessToken}`);
      xhr.responseType = "blob";
      xhr.timeout = 300000; // 5 minutes timeout

      // Send request
      xhr.send(formData);
    });
  }

  /**
   * Cancel an active upload
   */
  cancelUpload(fileId) {
    const xhr = this.activeRequests.get(fileId);
    if (xhr) {
      xhr.abort();
      this.activeRequests.delete(fileId);
      return true;
    }
    return false;
  }

  /**
   * Cancel all active uploads
   */
  cancelAllUploads() {
    this.activeRequests.forEach((xhr) => xhr.abort());
    this.activeRequests.clear();
  }

  validateAuth(accessToken) {
    if (!accessToken) {
      throw new Error("Please log in to upload files");
    }
  }
}

export const uploadService = new UploadService();
```

### 1.2 Update MultipleFileUpload Component

**File:** `src/components/tools/common/MultipleFileUpload.jsx`

```javascript
const uploadFile = async (fileItem) => {
  const { id, file, mode, synonym, language, freezeWords } = fileItem;

  dispatch(updateFileStatus({ id, status: "uploading", progress: 0 }));

  try {
    const blob = await uploadService.uploadFile({
      file,
      fileId: id, // Pass ID for cancellation
      mode,
      synonym,
      language,
      freezeWords,
      accessToken,
      // Real-time progress callback
      onProgress: (percent) => {
        dispatch(
          updateFileStatus({
            id,
            status: "uploading",
            progress: percent,
          }),
        );
      },
    });

    const url = urlManager.create(blob);

    dispatch(
      updateFileStatus({
        id,
        status: "success",
        progress: 100,
        downloadUrl: url,
      }),
    );

    toastService.uploadSuccess(fileItem.fileName, () => {
      dispatch(toggleUpdateFileHistory());
    });

    dispatch(toggleUpdateFileHistory());
  } catch (err) {
    // Don't show error if cancelled
    if (err.message !== "Upload cancelled") {
      dispatch(
        updateFileStatus({
          id,
          status: "error",
          progress: 0,
          error: err.message,
        }),
      );

      toastService.uploadError(fileItem.fileName, err.message);
    }
  }
};

// Add cancel handler
const handleCancelUpload = (fileId) => {
  const cancelled = uploadService.cancelUpload(fileId);
  if (cancelled) {
    dispatch(
      updateFileStatus({
        id: fileId,
        status: "error",
        progress: 0,
        error: "Upload cancelled",
      }),
    );
  }
};
```

**Testing:**

- [ ] Upload large file (20MB) → progress updates smoothly
- [ ] Progress bar reflects actual upload progress
- [ ] Cancel upload → stops properly
- [ ] Multiple files → each has independent progress

---

## Step 2: Retry Logic with Exponential Backoff

### 2.1 Create Retry Utility

**File:** `src/utils/retryWithBackoff.js`

```javascript
import { UploadError } from "./uploadErrors";

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff(fn, options = {}) {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffMultiplier = 2,
    onRetry = null,
    shouldRetry = (error) => true,
  } = options;

  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry on client errors (4xx) except 408 (timeout) and 429 (rate limit)
      if (error instanceof UploadError) {
        if (error.statusCode >= 400 && error.statusCode < 500) {
          if (error.statusCode !== 408 && error.statusCode !== 429) {
            throw error; // Don't retry
          }
        }
      }

      // Check custom retry condition
      if (!shouldRetry(error)) {
        throw error;
      }

      // If this was the last attempt, throw
      if (attempt === maxRetries) {
        throw error;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(
        initialDelay * Math.pow(backoffMultiplier, attempt),
        maxDelay,
      );

      // Add jitter to prevent thundering herd
      const jitter = Math.random() * 0.3 * delay;
      const totalDelay = delay + jitter;

      // Notify about retry
      if (onRetry) {
        onRetry(attempt + 1, maxRetries + 1, totalDelay);
      }

      // Wait before retry
      await new Promise((resolve) => setTimeout(resolve, totalDelay));
    }
  }

  throw lastError;
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error) {
  // Network errors are retryable
  if (error.message.includes("Network error")) return true;
  if (error.message.includes("timeout")) return true;

  // Server errors (5xx) are retryable
  if (error instanceof UploadError) {
    if (error.statusCode >= 500) return true;
    if (error.statusCode === 429) return true; // Rate limit
    if (error.statusCode === 408) return true; // Timeout
  }

  return false;
}
```

### 2.2 Add Retry State to Redux

**File:** `src/redux/slices/uploadQueueSlice.js`

```javascript
// Add to file state
{
  // ... existing fields
  retryCount: 0,
  maxRetries: 3,
  isRetrying: false,
  lastError: null
}

// Add reducer
retryFile: (state, action) => {
  const { id } = action.payload;
  const file = state.files.find(f => f.id === id);

  if (file) {
    file.status = 'idle';
    file.progress = 0;
    file.error = null;
    file.retryCount = (file.retryCount || 0) + 1;
  }
},
```

### 2.3 Integrate Retry in Upload

**File:** `src/components/tools/common/MultipleFileUpload.jsx`

```javascript
import { retryWithBackoff, isRetryableError } from "@/utils/retryWithBackoff";

const uploadFile = async (fileItem) => {
  const {
    id,
    file,
    mode,
    synonym,
    language,
    freezeWords,
    retryCount = 0,
  } = fileItem;

  dispatch(updateFileStatus({ id, status: "uploading", progress: 0 }));

  try {
    await retryWithBackoff(
      async () => {
        const blob = await uploadService.uploadFile({
          file,
          fileId: id,
          mode,
          synonym,
          language,
          freezeWords,
          accessToken,
          onProgress: (percent) => {
            dispatch(
              updateFileStatus({
                id,
                status: "uploading",
                progress: percent,
              }),
            );
          },
        });

        const url = urlManager.create(blob);

        dispatch(
          updateFileStatus({
            id,
            status: "success",
            progress: 100,
            downloadUrl: url,
          }),
        );

        toastService.uploadSuccess(fileItem.fileName, () => {
          dispatch(toggleUpdateFileHistory());
        });

        dispatch(toggleUpdateFileHistory());
      },
      {
        maxRetries: 3,
        initialDelay: 1000,
        shouldRetry: isRetryableError,
        onRetry: (attempt, maxAttempts, delay) => {
          // Show retry feedback
          dispatch(
            updateFileStatus({
              id,
              status: "uploading",
              progress: 0,
              error: `Retrying... (${attempt}/${maxAttempts})`,
            }),
          );
        },
      },
    );
  } catch (err) {
    if (err.message !== "Upload cancelled") {
      const errorMessage = isRetryableError(err)
        ? `${err.message} (tried ${retryCount + 1} times)`
        : err.message;

      dispatch(
        updateFileStatus({
          id,
          status: "error",
          progress: 0,
          error: errorMessage,
        }),
      );

      toastService.uploadError(fileItem.fileName, errorMessage);
    }
  }
};

// Add manual retry handler
const handleRetryFile = (fileId) => {
  const file = files.find((f) => f.id === fileId);
  if (file && file.status === "error") {
    dispatch(retryFile({ id: fileId }));
    uploadQueue.add(() => uploadFile(file));
  }
};
```

### 2.4 Add Retry Button to UI

```javascript
{
  /* In file list item */
}
{
  f.status === "error" && (
    <Button size="sm" variant="outline" onClick={() => handleRetryFile(f.id)}>
      Retry
    </Button>
  );
}
```

**Testing:**

- [ ] Mock network failure → auto-retries 3 times
- [ ] Mock 500 error → auto-retries
- [ ] Mock 400 error → doesn't retry
- [ ] Manual retry button works
- [ ] Retry counter shows in UI

---

## Step 3: LocalStorage Persistence

### 3.1 Create Persistence Utility

**File:** `src/utils/uploadPersistence.js`

```javascript
const STORAGE_KEY = "upload_queue_v1";

/**
 * Serialize upload queue for storage
 * Note: Can't store File objects or blob URLs
 */
export function serializeUploadQueue(files) {
  return files.map((file) => ({
    id: file.id,
    fileName: file.fileName,
    fileSize: file.fileSize,
    status: file.status === "uploading" ? "interrupted" : file.status,
    progress: file.progress,
    error: file.error,
    timestamp: file.timestamp,
    mode: file.mode,
    synonym: file.synonym,
    language: file.language,
    freezeWords: file.freezeWords,
    retryCount: file.retryCount || 0,
    // Note: file and downloadUrl are NOT persisted
  }));
}

/**
 * Save upload queue to localStorage
 */
export function saveUploadQueue(files) {
  try {
    const serialized = serializeUploadQueue(files);
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 1,
        savedAt: Date.now(),
        files: serialized,
      }),
    );
    return true;
  } catch (error) {
    console.error("Failed to save upload queue:", error);
    return false;
  }
}

/**
 * Load upload queue from localStorage
 */
export function loadUploadQueue() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return null;

    const data = JSON.parse(saved);

    // Check version compatibility
    if (data.version !== 1) {
      console.warn("Incompatible upload queue version");
      return null;
    }

    // Check if data is too old (older than 24 hours)
    const age = Date.now() - data.savedAt;
    if (age > 24 * 60 * 60 * 1000) {
      console.info("Upload queue data is stale, ignoring");
      return null;
    }

    return data.files;
  } catch (error) {
    console.error("Failed to load upload queue:", error);
    return null;
  }
}

/**
 * Clear saved upload queue
 */
export function clearSavedUploadQueue() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch (error) {
    console.error("Failed to clear upload queue:", error);
    return false;
  }
}
```

### 3.2 Add Persistence to Redux Middleware

**File:** `src/redux/middleware/uploadPersistence.js`

```javascript
import { saveUploadQueue } from "@/utils/uploadPersistence";

/**
 * Middleware to persist upload queue to localStorage
 */
export const uploadPersistenceMiddleware = (store) => (next) => (action) => {
  const result = next(action);

  // Save after any upload queue action
  if (action.type?.startsWith("uploadQueue/")) {
    const state = store.getState();
    saveUploadQueue(state.uploadQueue.files);
  }

  return result;
};
```

### 3.3 Register Middleware

**File:** `src/redux/store.js`

```javascript
import { configureStore } from "@reduxjs/toolkit";
import { uploadPersistenceMiddleware } from "./middleware/uploadPersistence";

export const store = configureStore({
  reducer: {
    // ... reducers
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(uploadPersistenceMiddleware),
});
```

### 3.4 Restore State on App Load

**File:** `src/components/tools/common/MultipleFileUpload.jsx`

```javascript
import {
  loadUploadQueue,
  clearSavedUploadQueue,
} from "@/utils/uploadPersistence";

export default function MultipleFileUpload(props) {
  const dispatch = useDispatch();
  const hasRestoredRef = useRef(false);

  // Restore from localStorage on mount
  useEffect(() => {
    if (!hasRestoredRef.current) {
      const savedFiles = loadUploadQueue();

      if (savedFiles && savedFiles.length > 0) {
        // Show notification about restored uploads
        const interruptedCount = savedFiles.filter(
          (f) => f.status === "interrupted",
        ).length;

        if (interruptedCount > 0) {
          toastService.info(
            `${interruptedCount} upload(s) were interrupted. They have been restored but will need to be re-uploaded.`,
          );
        }

        // Add restored files to Redux
        dispatch(addFiles(savedFiles));
      }

      hasRestoredRef.current = true;
    }
  }, [dispatch]);

  // ... rest of component
}
```

**Testing:**

- [ ] Upload files → refresh page → files restored
- [ ] Uploading files → refresh → marked as interrupted
- [ ] Old data (>24h) → ignored
- [ ] Clear completed → removed from localStorage

---

## Step 4: Network Status Detection

### 4.1 Create Network Hook

**File:** `src/hooks/useNetworkStatus.js`

```javascript
import { useState, useEffect } from "react";

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true,
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return isOnline;
}
```

### 4.2 Integrate Network Detection

**File:** `src/components/tools/common/MultipleFileUpload.jsx`

```javascript
import { useNetworkStatus } from "@/hooks/useNetworkStatus";

export default function MultipleFileUpload(props) {
  const isOnline = useNetworkStatus();

  // Show warning when offline
  useEffect(() => {
    if (!isOnline) {
      toastService.info(
        "You are offline. Uploads will resume when connection is restored.",
      );
    }
  }, [isOnline]);

  // Pause uploads when offline
  const uploadFile = async (fileItem) => {
    // Check network before starting
    if (!isOnline) {
      dispatch(
        updateFileStatus({
          id: fileItem.id,
          status: "error",
          error: "No internet connection",
        }),
      );
      return;
    }

    // ... rest of upload logic
  };

  // Resume failed uploads when coming back online
  useEffect(() => {
    if (isOnline) {
      const failedFiles = files.filter(
        (f) => f.status === "error" && f.error?.includes("Network error"),
      );

      if (failedFiles.length > 0) {
        toastService.info(
          `Connection restored. Retrying ${failedFiles.length} failed upload(s).`,
        );

        failedFiles.forEach((file) => {
          handleRetryFile(file.id);
        });
      }
    }
  }, [isOnline, files]);

  return (
    <>
      {/* Show offline banner */}
      {!isOnline && (
        <div className="bg-destructive/10 border-destructive mb-2 rounded-md border p-2 text-sm">
          <AlertCircle className="mr-2 inline h-4 w-4" />
          You are currently offline. Uploads are paused.
        </div>
      )}

      {/* ... rest of UI */}
    </>
  );
}
```

**Testing:**

- [ ] Go offline → uploads pause
- [ ] Come back online → uploads resume
- [ ] Offline banner shows/hides correctly
- [ ] Failed uploads auto-retry when back online

---

## Step 5: Token Refresh Handling

### 5.1 Create Token Refresh Utility

**File:** `src/utils/tokenRefresh.js`

```javascript
/**
 * Check if error is due to expired token
 */
export function isTokenExpiredError(error) {
  return (
    error?.statusCode === 401 ||
    error?.code === "AUTH_EXPIRED" ||
    error?.message?.includes("Session expired")
  );
}

/**
 * Attempt to refresh access token
 * Note: Implementation depends on your auth system
 */
export async function refreshAccessToken() {
  try {
    // This is placeholder - implement based on your auth
    const response = await fetch("/api/auth/refresh", {
      method: "POST",
      credentials: "include", // If using httpOnly cookies
    });

    if (!response.ok) {
      throw new Error("Token refresh failed");
    }

    const data = await response.json();
    return data.accessToken;
  } catch (error) {
    throw new Error("Please log in again");
  }
}
```

### 5.2 Integrate in Upload Service

**File:** `src/services/uploadService.js`

```javascript
import { isTokenExpiredError, refreshAccessToken } from "@/utils/tokenRefresh";

class UploadService {
  // ... existing code

  async uploadFile({
    file,
    fileId,
    mode,
    synonym,
    language,
    freezeWords,
    accessToken,
    onProgress,
    onTokenRefresh,
  }) {
    try {
      return await this._performUpload({
        file,
        fileId,
        mode,
        synonym,
        language,
        freezeWords,
        accessToken,
        onProgress,
      });
    } catch (error) {
      // If token expired, try to refresh and retry once
      if (isTokenExpiredError(error)) {
        try {
          const newToken = await refreshAccessToken();

          // Notify caller about new token
          if (onTokenRefresh) {
            onTokenRefresh(newToken);
          }

          // Retry with new token
          return await this._performUpload({
            file,
            fileId,
            mode,
            synonym,
            language,
            freezeWords,
            accessToken: newToken,
            onProgress,
          });
        } catch (refreshError) {
          throw new Error("Session expired. Please log in again.");
        }
      }

      throw error;
    }
  }

  _performUpload({
    file,
    fileId,
    mode,
    synonym,
    language,
    freezeWords,
    accessToken,
    onProgress,
  }) {
    // Move existing upload logic here
    // ... (existing XHR code)
  }
}
```

**Testing:**

- [ ] Mock 401 error → token refreshes automatically
- [ ] Token refresh success → upload retries
- [ ] Token refresh fails → shows login error
- [ ] New token used for subsequent uploads

---

## Step 6: Page Unload Warning

### 6.1 Add Unload Warning Hook

**File:** `src/hooks/useUploadWarning.js`

```javascript
import { useEffect } from "react";
import { useSelector } from "react-redux";
import { selectHasActiveUploads } from "@/redux/slices/uploadQueueSlice";

export function useUploadWarning() {
  const hasActiveUploads = useSelector(selectHasActiveUploads);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasActiveUploads) {
        e.preventDefault();
        e.returnValue =
          "Files are still uploading. Are you sure you want to leave?";
        return e.returnValue;
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [hasActiveUploads]);
}
```

### 6.2 Use in Component

```javascript
import { useUploadWarning } from "@/hooks/useUploadWarning";

export default function MultipleFileUpload(props) {
  useUploadWarning();
  // ... rest of component
}
```

**Testing:**

- [ ] Try to close tab during upload → warning shows
- [ ] No active uploads → no warning
- [ ] Confirm leave → uploads cancelled

---

## Files Created/Modified

### New Files

```
src/
  utils/
    retryWithBackoff.js                    [NEW]
    uploadPersistence.js                   [NEW]
    tokenRefresh.js                        [NEW]

  hooks/
    useNetworkStatus.js                    [NEW]
    useUploadWarning.js                    [NEW]

  redux/
    middleware/
      uploadPersistence.js                 [NEW]
```

### Modified Files

```
src/
  services/
    uploadService.js                       [MODIFY]

  components/
    tools/
      common/
        MultipleFileUpload.jsx             [MODIFY]

  redux/
    store.js                               [MODIFY]
    slices/
      uploadQueueSlice.js                  [MODIFY]
```

---

## Testing Checklist

### Progress Tracking

- [ ] Large file shows real progress
- [ ] Progress smooth (not jumpy)
- [ ] Cancel works mid-upload

### Retry Logic

- [ ] Network error → auto-retries 3 times
- [ ] Server error (500) → retries
- [ ] Client error (400) → doesn't retry
- [ ] Manual retry works
- [ ] Exponential backoff delays correct

### Persistence

- [ ] Upload → refresh → state restored
- [ ] Completed files → not restored
- [ ] Old data (>24h) → ignored
- [ ] LocalStorage quota handling

### Network Detection

- [ ] Go offline → uploads pause
- [ ] Come online → resume
- [ ] Offline banner accurate
- [ ] Auto-retry after reconnect

### Token Refresh

- [ ] 401 → token refresh attempted
- [ ] Refresh success → upload continues
- [ ] Refresh fail → login prompt

### Unload Warning

- [ ] Active uploads → warning
- [ ] No uploads → no warning
- [ ] Works in all browsers

---

## Success Criteria

- [ ] Real progress tracking works
- [ ] Auto-retry on failures (with backoff)
- [ ] State persists across page refresh
- [ ] Handles offline/online gracefully
- [ ] Token refresh implemented
- [ ] Page unload warning works
- [ ] All Phase 0 & 1 features still work
- [ ] No performance degradation

---

## Design Patterns Used

1. **Retry Pattern** - Exponential backoff with jitter
2. **Persistence Pattern** - Serialize/deserialize for storage
3. **Middleware Pattern** - Auto-save on state changes
4. **Observer Pattern** - Network status monitoring
5. **Proxy Pattern** - Token refresh transparent to caller

---

## Estimated Time

- Real progress tracking: 4 hours
- Retry logic: 4 hours
- Persistence: 3 hours
- Network detection: 2 hours
- Token refresh: 3 hours
- Unload warning: 1 hour
- Testing: 6 hours

**Total: 23-24 hours**

---

## Next Phase

After completing Phase 2, proceed to Phase 3 for polish (accessibility, analytics, performance optimization).
