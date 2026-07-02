# Phase 3: Polish & Optimization

**Duration:** 3-4 days  
**Priority:** 🟢 MEDIUM - Quality & UX polish  
**Goal:** Accessibility, analytics, performance optimization, comprehensive testing

---

## Overview

This phase adds the finishing touches: making the feature accessible to all users, tracking metrics for improvement, optimizing performance, and ensuring comprehensive test coverage.

**Prerequisites:** Phase 0, 1, and 2 must be completed

---

## Step 1: Accessibility (a11y)

### 1.1 Screen Reader Support

**File:** `src/components/tools/common/MultipleFileUpload.jsx`

```javascript
export default function MultipleFileUpload(props) {
  const stats = useSelector(selectUploadStats);
  const hasActiveUploads = useSelector(selectHasActiveUploads);

  // Live region for screen reader announcements
  const [srMessage, setSrMessage] = useState("");

  // Announce upload progress to screen readers
  useEffect(() => {
    if (hasActiveUploads) {
      setSrMessage(
        `Uploading ${stats.uploading} files. ${stats.completed} completed.`,
      );
    } else if (stats.completed > 0 && stats.uploading === 0) {
      setSrMessage(
        `All uploads complete. ${stats.completed} files ready to download.`,
      );
    }
  }, [hasActiveUploads, stats]);

  return (
    <>
      {/* Screen reader only live region */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {srMessage}
      </div>

      <Button
        onClick={handleOpen}
        aria-label="Upload multiple documents"
        aria-haspopup="dialog"
      >
        <CloudUpload aria-hidden="true" />
        <span>Multi Upload Document</span>
      </Button>

      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent
          aria-labelledby="upload-dialog-title"
          aria-describedby="upload-dialog-description"
        >
          <DialogHeader>
            <DialogTitle id="upload-dialog-title">
              Upload Multiple Documents
            </DialogTitle>
          </DialogHeader>

          <div id="upload-dialog-description" className="sr-only">
            Drag and drop files or click to browse. Supports PDF, DOCX, and TXT
            files up to 25MB.
          </div>

          {/* Upload zone */}
          <div
            role="button"
            tabIndex={0}
            aria-label="Click to select files or drag and drop files here"
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                inputRef.current?.click();
              }
            }}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onClick={() => inputRef.current?.click()}
            className="border-border focus:ring-primary mb-2 cursor-pointer rounded-lg border-2 border-dashed p-4 text-center focus:ring-2 focus:outline-none"
          >
            <CloudUpload
              aria-hidden="true"
              className="mb-1 inline-block size-8"
            />
            <div className="text-base font-medium">
              Upload Multiple Documents
            </div>
            <div className="text-muted-foreground mb-1 text-sm">
              Drop files here or <b>browse</b> your machine
            </div>
            <input
              ref={inputRef}
              type="file"
              multiple
              accept=".pdf,.docx,.txt"
              hidden
              aria-label="File upload input"
              onChange={(e) => handleFilesSelected(e.target.files)}
            />
          </div>

          {/* File list */}
          <div role="list" aria-label="Upload queue" className="space-y-2">
            {files.map((f) => (
              <div
                key={f.id}
                role="listitem"
                aria-label={`${f.fileName}, ${getStatusText(f.status)}`}
                className="flex items-center gap-2"
              >
                <div className="flex-1">
                  <div className="truncate text-sm font-medium">
                    {f.fileName}
                  </div>
                  <div
                    className="text-muted-foreground text-xs"
                    aria-live="polite"
                  >
                    {getStatusText(f.status, f.progress, f.error)}
                  </div>
                </div>

                {/* Progress bar with aria-label */}
                {(f.status === "uploading" || f.status === "success") && (
                  <Progress
                    value={f.progress}
                    aria-label={`Upload progress: ${f.progress}%`}
                    className="w-20"
                  />
                )}

                {/* Download button */}
                {f.status === "success" && f.downloadUrl && (
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleDownload(f)}
                    aria-label={`Download ${f.fileName}`}
                  >
                    <Download className="h-4 w-4" aria-hidden="true" />
                  </Button>
                )}

                {/* Remove button */}
                {(f.status === "success" || f.status === "error") && (
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleRemoveFile(f.id)}
                    aria-label={`Remove ${f.fileName}`}
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                  </Button>
                )}

                {/* Retry button */}
                {f.status === "error" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRetryFile(f.id)}
                    aria-label={`Retry uploading ${f.fileName}`}
                  >
                    Retry
                  </Button>
                )}
              </div>
            ))}
          </div>

          <DialogFooter>{/* ... footer content ... */}</DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Helper for consistent status text
function getStatusText(status, progress = 0, error = null) {
  if (error) return error;

  switch (status) {
    case "idle":
      return "Waiting to upload";
    case "uploading":
      return `Uploading... ${progress}%`;
    case "success":
      return "Upload complete";
    case "error":
      return error || "Upload failed";
    default:
      return "";
  }
}
```

### 1.2 Keyboard Navigation

**File:** `src/components/tools/common/UploadProgressIndicator.jsx`

```javascript
export default function UploadProgressIndicator() {
  const indicatorRef = useRef(null);

  // Keyboard support
  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleClick();
    } else if (e.key === "Escape" && !hasActiveUploads) {
      e.preventDefault();
      handleDismiss(e);
    }
  };

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          ref={indicatorRef}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed right-6 bottom-6 z-50"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          <div
            onClick={handleClick}
            onKeyDown={handleKeyDown}
            tabIndex={0}
            role="button"
            aria-label={`File upload progress: ${stats.completed} of ${stats.total} completed. Press Enter to view details.`}
            className="bg-card border-border focus:ring-primary cursor-pointer rounded-lg border p-4 shadow-lg transition-all hover:shadow-xl focus:ring-2 focus:outline-none"
          >
            {/* ... existing content ... */}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

### 1.3 Focus Management

```javascript
// Focus trap in modal
import { useFocusTrap } from "@/hooks/useFocusTrap";

export default function MultipleFileUpload(props) {
  const modalRef = useRef(null);

  // Trap focus when modal opens
  useFocusTrap(modalRef, isOpen);

  // Return focus to trigger button when modal closes
  const triggerButtonRef = useRef(null);

  useEffect(() => {
    if (!isOpen && triggerButtonRef.current) {
      triggerButtonRef.current.focus();
    }
  }, [isOpen]);

  return (
    <Button ref={triggerButtonRef} onClick={handleOpen}>
      Multi Upload Document
    </Button>
  );
}
```

**Testing:**

- [ ] Screen reader announces status changes
- [ ] All interactive elements accessible via keyboard
- [ ] Focus trap works in modal
- [ ] ARIA labels descriptive
- [ ] Works with NVDA/JAWS/VoiceOver

---

## Step 2: Analytics Integration

### 2.1 Create Analytics Service

**File:** `src/services/analyticsService.js`

```javascript
class AnalyticsService {
  /**
   * Track upload started
   */
  trackUploadStarted({ fileCount, totalSize, mode, userType }) {
    this.track("Upload Started", {
      file_count: fileCount,
      total_size_mb: (totalSize / (1024 * 1024)).toFixed(2),
      mode: mode,
      user_type: userType, // free/paid
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Track upload completed
   */
  trackUploadCompleted({
    fileId,
    fileName,
    fileSize,
    duration,
    mode,
    retryCount,
  }) {
    this.track("Upload Completed", {
      file_id: fileId,
      file_name: fileName,
      file_size_mb: (fileSize / (1024 * 1024)).toFixed(2),
      duration_seconds: (duration / 1000).toFixed(2),
      mode: mode,
      retry_count: retryCount || 0,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Track upload failed
   */
  trackUploadFailed({ fileId, fileName, error, retryCount, mode }) {
    this.track("Upload Failed", {
      file_id: fileId,
      file_name: fileName,
      error_message: error,
      error_code: this.extractErrorCode(error),
      retry_count: retryCount || 0,
      mode: mode,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Track upload cancelled
   */
  trackUploadCancelled({ fileId, fileName, progress }) {
    this.track("Upload Cancelled", {
      file_id: fileId,
      file_name: fileName,
      progress_percent: progress,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Track batch completed
   */
  trackBatchCompleted({
    totalFiles,
    successCount,
    failureCount,
    totalDuration,
  }) {
    this.track("Batch Completed", {
      total_files: totalFiles,
      success_count: successCount,
      failure_count: failureCount,
      success_rate: ((successCount / totalFiles) * 100).toFixed(2),
      total_duration_seconds: (totalDuration / 1000).toFixed(2),
      avg_duration_per_file: (totalDuration / totalFiles / 1000).toFixed(2),
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Track user action
   */
  trackAction(action, properties = {}) {
    this.track(`Upload: ${action}`, properties);
  }

  /**
   * Internal track method - integrate with your analytics provider
   */
  track(eventName, properties) {
    // Example: Google Analytics 4
    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("event", eventName, properties);
    }

    // Example: Mixpanel
    if (typeof window !== "undefined" && window.mixpanel) {
      window.mixpanel.track(eventName, properties);
    }

    // Example: Custom analytics API
    if (process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT) {
      fetch(process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: eventName,
          properties: properties,
          timestamp: Date.now(),
        }),
      }).catch((err) => console.error("Analytics error:", err));
    }

    // Development logging
    if (process.env.NODE_ENV === "development") {
      console.log("📊 Analytics:", eventName, properties);
    }
  }

  extractErrorCode(error) {
    if (error.includes("401")) return "AUTH_EXPIRED";
    if (error.includes("413")) return "FILE_TOO_LARGE";
    if (error.includes("429")) return "RATE_LIMIT";
    if (error.includes("500")) return "SERVER_ERROR";
    if (error.includes("Network")) return "NETWORK_ERROR";
    return "UNKNOWN_ERROR";
  }
}

export const analyticsService = new AnalyticsService();
```

### 2.2 Integrate Analytics

**File:** `src/components/tools/common/MultipleFileUpload.jsx`

```javascript
import { analyticsService } from "@/services/analyticsService";

export default function MultipleFileUpload(props) {
  const handleFilesSelected = async (fileList) => {
    // ... validation ...

    // Track upload started
    analyticsService.trackUploadStarted({
      fileCount: preparedFiles.length,
      totalSize: preparedFiles.reduce((sum, f) => sum + f.fileSize, 0),
      mode: selectedMode,
      userType: paidUser ? "paid" : "free",
    });

    // ... rest of logic
  };

  const uploadFile = async (fileItem) => {
    const startTime = Date.now();

    try {
      // ... upload logic ...

      const duration = Date.now() - startTime;

      // Track success
      analyticsService.trackUploadCompleted({
        fileId: fileItem.id,
        fileName: fileItem.fileName,
        fileSize: fileItem.fileSize,
        duration: duration,
        mode: fileItem.mode,
        retryCount: fileItem.retryCount || 0,
      });
    } catch (err) {
      // Track failure
      analyticsService.trackUploadFailed({
        fileId: fileItem.id,
        fileName: fileItem.fileName,
        error: err.message,
        retryCount: fileItem.retryCount || 0,
        mode: fileItem.mode,
      });
    }
  };

  const handleCancelUpload = (fileId) => {
    const file = files.find((f) => f.id === fileId);

    if (uploadService.cancelUpload(fileId)) {
      analyticsService.trackUploadCancelled({
        fileId: file.id,
        fileName: file.fileName,
        progress: file.progress,
      });
    }
  };
}
```

### 2.3 Track Batch Completion

**File:** `src/hooks/useUploadCompletion.js`

```javascript
import { analyticsService } from "@/services/analyticsService";

export const useUploadCompletion = () => {
  const batchStartTimeRef = useRef(null);

  useEffect(() => {
    // Batch started
    if (!prevHadActiveUploads.current && hasActiveUploads) {
      batchStartTimeRef.current = Date.now();
    }

    // Batch completed
    if (
      prevHadActiveUploads.current &&
      !hasActiveUploads &&
      stats.completed > 0
    ) {
      const duration = Date.now() - batchStartTimeRef.current;

      // Track batch completion
      analyticsService.trackBatchCompleted({
        totalFiles: stats.total,
        successCount: stats.completed,
        failureCount: stats.failed,
        totalDuration: duration,
      });

      // ... toast notification ...
    }

    prevHadActiveUploads.current = hasActiveUploads;
  }, [hasActiveUploads, stats]);
};
```

**Testing:**

- [ ] Events tracked correctly
- [ ] Properties captured accurately
- [ ] Works with your analytics provider
- [ ] No tracking in development (or separate environment)

---

## Step 3: Performance Optimization

### 3.1 Debounce Progress Updates

**File:** `src/utils/debounce.js`

```javascript
export function debounce(fn, delay) {
  let timeoutId;

  return function debounced(...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

export function throttle(fn, limit) {
  let inThrottle;

  return function throttled(...args) {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}
```

**Usage:**

```javascript
const uploadFile = async (fileItem) => {
  // Throttle progress updates to max once per 100ms
  const throttledProgressUpdate = throttle((percent) => {
    dispatch(
      updateFileStatus({
        id: fileItem.id,
        status: "uploading",
        progress: percent,
      }),
    );
  }, 100);

  const blob = await uploadService.uploadFile({
    // ...
    onProgress: throttledProgressUpdate,
  });
};
```

### 3.2 Virtualize Long File Lists

**File:** `src/components/tools/common/VirtualizedFileList.jsx`

```javascript
import { FixedSizeList } from "react-window";

export function VirtualizedFileList({ files, onDownload, onRemove, onRetry }) {
  const itemHeight = 60; // Height of each file item
  const listHeight = Math.min(files.length * itemHeight, 400); // Max 400px

  const Row = ({ index, style }) => {
    const file = files[index];

    return (
      <div style={style} className="px-2">
        <FileListItem
          file={file}
          onDownload={onDownload}
          onRemove={onRemove}
          onRetry={onRetry}
        />
      </div>
    );
  };

  // Only virtualize if > 20 files
  if (files.length <= 20) {
    return files.map((file) => (
      <FileListItem
        key={file.id}
        file={file}
        onDownload={onDownload}
        onRemove={onRemove}
        onRetry={onRetry}
      />
    ));
  }

  return (
    <FixedSizeList
      height={listHeight}
      itemCount={files.length}
      itemSize={itemHeight}
      width="100%"
    >
      {Row}
    </FixedSizeList>
  );
}
```

### 3.3 Lazy Load Components

```javascript
import { lazy, Suspense } from "react";

// Lazy load the upload indicator
const UploadProgressIndicator = lazy(() => import("./UploadProgressIndicator"));

export default function Layout({ children }) {
  return (
    <>
      {children}
      <Suspense fallback={null}>
        <UploadProgressIndicator />
      </Suspense>
    </>
  );
}
```

### 3.4 Memoize Expensive Calculations

```javascript
import { useMemo } from "react";

export default function MultipleFileUpload(props) {
  const files = useSelector(selectAllFiles);

  // Memoize filtered lists
  const activeUploads = useMemo(
    () => files.filter((f) => f.status === "uploading"),
    [files],
  );

  const completedUploads = useMemo(
    () => files.filter((f) => f.status === "success"),
    [files],
  );

  const failedUploads = useMemo(
    () => files.filter((f) => f.status === "error"),
    [files],
  );

  // Memoize total size calculation
  const totalSize = useMemo(
    () => files.reduce((sum, f) => sum + f.fileSize, 0),
    [files],
  );

  // ... rest of component
}
```

**Testing:**

- [ ] Progress updates smooth (not laggy)
- [ ] Large file lists (100+) render quickly
- [ ] No unnecessary re-renders
- [ ] Memory usage stable

---

## Step 4: Error Logging & Monitoring

### 4.1 Create Error Logger

**File:** `src/services/errorLogger.js`

```javascript
class ErrorLogger {
  /**
   * Log upload error for monitoring
   */
  logUploadError(error, context = {}) {
    const errorData = {
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
      stack: error.stack,
      context: {
        ...context,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
      },
    };

    // Send to error tracking service (e.g., Sentry)
    if (typeof window !== "undefined" && window.Sentry) {
      window.Sentry.captureException(error, {
        extra: errorData.context,
      });
    }

    // Log to custom endpoint
    if (process.env.NEXT_PUBLIC_ERROR_LOG_ENDPOINT) {
      fetch(process.env.NEXT_PUBLIC_ERROR_LOG_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(errorData),
      }).catch(() => {
        // Silently fail - don't break user experience
      });
    }

    // Development logging
    if (process.env.NODE_ENV === "development") {
      console.error("🔴 Upload Error:", errorData);
    }
  }

  /**
   * Log performance metrics
   */
  logPerformance(metric, value, context = {}) {
    const perfData = {
      metric,
      value,
      context: {
        ...context,
        timestamp: new Date().toISOString(),
      },
    };

    // Send to performance monitoring
    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("event", "timing_complete", {
        name: metric,
        value: value,
        event_category: "Upload Performance",
      });
    }

    if (process.env.NODE_ENV === "development") {
      console.log("⚡ Performance:", perfData);
    }
  }
}

export const errorLogger = new ErrorLogger();
```

### 4.2 Integrate Error Logging

```javascript
const uploadFile = async (fileItem) => {
  try {
    // ... upload logic ...
  } catch (err) {
    // Log error with context
    errorLogger.logUploadError(err, {
      fileId: fileItem.id,
      fileName: fileItem.fileName,
      fileSize: fileItem.fileSize,
      mode: fileItem.mode,
      retryCount: fileItem.retryCount || 0,
    });

    // ... error handling ...
  }
};
```

---

## Step 5: Comprehensive Testing

### 5.1 Unit Tests

**File:** `src/utils/__tests__/fileValidation.test.js`

```javascript
import { describe, it, expect } from "vitest";
import {
  validateFile,
  sanitizeFileName,
  generateFileId,
} from "../fileValidation";

describe("fileValidation", () => {
  describe("validateFile", () => {
    it("should accept valid PDF file", async () => {
      const file = new File(["%PDF-1.4"], "test.pdf", {
        type: "application/pdf",
      });
      const result = await validateFile(file);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should reject file > 25MB", async () => {
      const largeFile = new File(
        [new ArrayBuffer(26 * 1024 * 1024)],
        "large.pdf",
        {
          type: "application/pdf",
        },
      );
      const result = await validateFile(largeFile);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("File must be ≤ 25 MB");
    });

    it("should reject invalid MIME type", async () => {
      const file = new File(["data"], "test.exe", {
        type: "application/x-msdownload",
      });
      const result = await validateFile(file);
      expect(result.valid).toBe(false);
    });
  });

  describe("sanitizeFileName", () => {
    it("should remove HTML tags", () => {
      const result = sanitizeFileName('<script>alert("xss")</script>file.pdf');
      expect(result).toBe("file.pdf");
    });

    it("should replace dangerous characters", () => {
      const result = sanitizeFileName("file:name?.pdf");
      expect(result).toBe("file_name_.pdf");
    });

    it("should truncate long names", () => {
      const longName = "a".repeat(300) + ".pdf";
      const result = sanitizeFileName(longName);
      expect(result.length).toBeLessThanOrEqual(255);
    });
  });

  describe("generateFileId", () => {
    it("should generate unique IDs", () => {
      const file = new File(["data"], "test.pdf", { type: "application/pdf" });
      const id1 = generateFileId(file);
      const id2 = generateFileId(file);
      expect(id1).not.toBe(id2);
    });
  });
});
```

### 5.2 Integration Tests

**File:** `src/components/tools/common/__tests__/MultipleFileUpload.test.jsx`

```javascript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import MultipleFileUpload from "../MultipleFileUpload";
import uploadQueueReducer from "@/redux/slices/uploadQueueSlice";

describe("MultipleFileUpload", () => {
  let store;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        uploadQueue: uploadQueueReducer,
        auth: () => ({ accessToken: "test-token" }),
      },
    });
  });

  it("should render upload button", () => {
    render(
      <Provider store={store}>
        <MultipleFileUpload paidUser={true} />
      </Provider>,
    );

    expect(screen.getByText("Multi Upload Document")).toBeInTheDocument();
  });

  it("should open modal when button clicked", async () => {
    render(
      <Provider store={store}>
        <MultipleFileUpload paidUser={true} />
      </Provider>,
    );

    fireEvent.click(screen.getByText("Multi Upload Document"));

    await waitFor(() => {
      expect(screen.getByText("Upload Multiple Documents")).toBeInTheDocument();
    });
  });

  it("should add files to queue when selected", async () => {
    render(
      <Provider store={store}>
        <MultipleFileUpload paidUser={true} />
      </Provider>,
    );

    // Open modal
    fireEvent.click(screen.getByText("Multi Upload Document"));

    // Create mock file
    const file = new File(["content"], "test.pdf", { type: "application/pdf" });
    const input = screen.getByLabelText("File upload input");

    // Upload file
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      const state = store.getState();
      expect(state.uploadQueue.files).toHaveLength(1);
      expect(state.uploadQueue.files[0].fileName).toBe("test.pdf");
    });
  });

  // More tests...
});
```

### 5.3 E2E Tests (Playwright/Cypress)

**File:** `tests/e2e/file-upload.spec.js`

```javascript
import { test, expect } from "@playwright/test";

test.describe("File Upload Flow", () => {
  test("should upload files successfully", async ({ page }) => {
    await page.goto("/paraphrase");

    // Click upload button
    await page.click("text=Multi Upload Document");

    // Wait for modal
    await expect(page.locator("text=Upload Multiple Documents")).toBeVisible();

    // Upload file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles("./fixtures/test-document.pdf");

    // Wait for upload to complete
    await expect(page.locator("text=Completed")).toBeVisible({
      timeout: 30000,
    });

    // Verify download button appears
    await expect(page.locator('button[aria-label*="Download"]')).toBeVisible();

    // Close modal
    await page.click("text=Close");

    // Verify progress indicator shows
    await expect(page.locator("text=All files processed")).toBeVisible();
  });

  test("should handle offline scenario", async ({ page, context }) => {
    await page.goto("/paraphrase");

    // Click upload button
    await page.click("text=Multi Upload Document");

    // Go offline
    await context.setOffline(true);

    // Try to upload
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles("./fixtures/test-document.pdf");

    // Should show offline message
    await expect(page.locator("text=You are currently offline")).toBeVisible();

    // Go back online
    await context.setOffline(false);

    // Should auto-retry
    await expect(page.locator("text=Connection restored")).toBeVisible();
  });

  // More E2E tests...
});
```

**Testing Checklist:**

- [ ] Unit tests for all utilities (>80% coverage)
- [ ] Integration tests for components
- [ ] E2E tests for critical user flows
- [ ] Test error scenarios
- [ ] Test network failures
- [ ] Test accessibility with axe
- [ ] Cross-browser testing
- [ ] Mobile responsive testing

---

## Step 6: Documentation

### 6.1 Code Documentation

Add JSDoc comments to all public APIs:

```javascript
/**
 * Upload a file with progress tracking and retry logic
 *
 * @param {Object} params - Upload parameters
 * @param {File} params.file - The file to upload
 * @param {string} params.fileId - Unique file identifier
 * @param {string} params.mode - Paraphrase mode
 * @param {string} params.synonym - Synonym level
 * @param {string} params.language - Target language
 * @param {string[]} params.freezeWords - Words to not paraphrase
 * @param {string} params.accessToken - JWT access token
 * @param {Function} params.onProgress - Progress callback (percent: number) => void
 * @returns {Promise<Blob>} The processed file as a blob
 * @throws {UploadError} If upload fails after retries
 *
 * @example
 * const blob = await uploadService.uploadFile({
 *   file: myFile,
 *   fileId: 'abc123',
 *   mode: 'standard',
 *   synonym: 'medium',
 *   language: 'en',
 *   accessToken: token,
 *   onProgress: (percent) => console.log(`Progress: ${percent}%`)
 * });
 */
```

### 6.2 User Guide

**File:** `docs/file-upload/USER_GUIDE.md`

```markdown
# Multi-File Upload - User Guide

## How to Upload Multiple Files

1. Click the "Multi Upload Document" button
2. Drag and drop files or click to browse
3. Wait for files to process
4. Download processed files

## Features

### Background Uploads

- Close the modal while files upload
- Continue working on other tasks
- Progress indicator shows in bottom-right corner

### File Requirements

- Supported formats: PDF, DOCX, TXT
- Maximum size: 25MB per file
- Free users: 3 files per batch
- Premium users: 250 files per batch

### Error Recovery

- Auto-retry on network failures
- Manual retry button for failed files
- Works offline (uploads resume when online)

## Keyboard Shortcuts

- `Enter` or `Space` - Open file browser
- `Escape` - Close modal (if no active uploads)
- `Tab` - Navigate between files

## Troubleshooting

### Upload Fails

- Check internet connection
- Verify file size < 25MB
- Ensure file format is supported
- Try manual retry

### Slow Upload

- Large files take longer
- Check network speed
- Max 3 files upload simultaneously

### Session Expired

- Log in again if prompted
- Uploads will auto-retry with new session
```

---

## Files Created/Modified

### New Files

```
src/
  utils/
    debounce.js                           [NEW]
    __tests__/
      fileValidation.test.js              [NEW]

  services/
    analyticsService.js                    [NEW]
    errorLogger.js                         [NEW]

  components/
    tools/
      common/
        VirtualizedFileList.jsx           [NEW]
        __tests__/
          MultipleFileUpload.test.jsx     [NEW]

  hooks/
    useFocusTrap.js                       [NEW]

tests/
  e2e/
    file-upload.spec.js                   [NEW]

docs/
  file-upload/
    USER_GUIDE.md                         [NEW]
    PHASE3_POLISH_OPTIMIZATION.md        [THIS FILE]
```

### Modified Files

```
src/
  components/
    tools/
      common/
        MultipleFileUpload.jsx            [MODIFY]
        UploadProgressIndicator.jsx       [MODIFY]

  hooks/
    useUploadCompletion.js                [MODIFY]
```

---

## Success Criteria

- [ ] Full keyboard navigation works
- [ ] Screen readers announce all updates
- [ ] WCAG 2.1 AA compliance
- [ ] Analytics tracking implemented
- [ ] Performance optimized (no lag with 100+ files)
- [ ] Error logging integrated
- [ ] Unit test coverage > 80%
- [ ] Integration tests passing
- [ ] E2E tests passing
- [ ] Documentation complete
- [ ] Cross-browser tested (Chrome, Firefox, Safari, Edge)
- [ ] Mobile responsive

---

## Design Patterns Used

1. **Observer Pattern** - Analytics tracking
2. **Decorator Pattern** - Error logging wrapper
3. **Strategy Pattern** - Different list rendering strategies
4. **Template Method** - Test structure
5. **Facade Pattern** - Simple APIs for complex operations

---

## Estimated Time

- Accessibility: 6 hours
- Analytics: 3 hours
- Performance optimization: 4 hours
- Error logging: 2 hours
- Unit tests: 6 hours
- Integration tests: 4 hours
- E2E tests: 4 hours
- Documentation: 3 hours

**Total: 32-34 hours**

---

## Final Checklist

Before marking Phase 3 complete:

- [ ] All accessibility tests pass (axe, WAVE)
- [ ] Analytics events verified in dashboard
- [ ] Performance benchmarks met
- [ ] Error logging working in production
- [ ] 80%+ test coverage achieved
- [ ] All E2E tests green
- [ ] Documentation reviewed
- [ ] Code review completed
- [ ] QA tested on all target browsers
- [ ] Mobile tested on iOS and Android
- [ ] Ready for production deployment

---

## Post-Launch

### Monitoring Metrics

Track these KPIs for the first month:

1. **Success Rate**: % of uploads that complete successfully
2. **Average Upload Time**: Per file size category
3. **Error Distribution**: Which errors are most common
4. **Retry Rate**: % of uploads that needed retry
5. **Cancellation Rate**: % of uploads cancelled by users
6. **Batch Size**: Average files per upload session
7. **User Satisfaction**: From feedback/support tickets

### Iterate Based on Data

- If success rate < 95% → investigate common failures
- If average time high → optimize server processing
- If cancellation rate high → improve UX/feedback

---

## Congratulations! 🎉

You now have a production-grade, accessible, performant file upload system with:

- ✅ Background uploads
- ✅ Real progress tracking
- ✅ Auto-retry logic
- ✅ Persistence across page refreshes
- ✅ Network resilience
- ✅ Full accessibility
- ✅ Analytics & monitoring
- ✅ Comprehensive tests
- ✅ Great documentation

The system is ready for production deployment and long-term maintenance.
