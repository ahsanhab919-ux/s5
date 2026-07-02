# Phase 0: Critical Fixes & Foundation

**Duration:** 1-2 days  
**Priority:** 🔴 CRITICAL - Must complete before other phases  
**Goal:** Fix critical bugs and establish solid foundation

---

## Overview

This phase addresses critical issues in the current implementation that could cause production problems. These are non-negotiable fixes that must be implemented first.

---

## Critical Issues to Fix

### 1. Memory Leak Prevention

**Problem:** Object URLs created but never revoked → memory leaks  
**Impact:** Browser crashes with multiple uploads  
**Location:** `MultipleFileUpload.jsx`

#### Implementation

```javascript
// Create a cleanup utility
// File: src/utils/paraphrase/fileUploadHelpers.js

export class FileURLManager {
  constructor() {
    this.urls = new Set();
  }

  create(blob) {
    const url = URL.createObjectURL(blob);
    this.urls.add(url);
    return url;
  }

  revoke(url) {
    if (this.urls.has(url)) {
      URL.revokeObjectURL(url);
      this.urls.delete(url);
    }
  }

  revokeAll() {
    this.urls.forEach((url) => URL.revokeObjectURL(url));
    this.urls.clear();
  }
}
```

**Usage in Component:**

```javascript
// In MultipleFileUpload.jsx
const urlManager = useRef(new FileURLManager()).current;

// When creating URL
const url = urlManager.create(blob);

// Cleanup on unmount
useEffect(() => {
  return () => urlManager.revokeAll();
}, []);

// Cleanup on file remove
const handleRemoveFile = (idx) => {
  const file = files[idx];
  if (file.downloadUrl) {
    urlManager.revoke(file.downloadUrl);
  }
  // ... rest of remove logic
};
```

**Testing:**

- [ ] Upload 10 files, close modal, check memory doesn't leak
- [ ] Upload files, download them, verify URLs are revoked
- [ ] Component unmount → all URLs cleaned up

---

### 2. Rate Limiting (Concurrent Upload Control)

**Problem:** All files upload simultaneously → server overload  
**Impact:** 250 concurrent requests crash server/browser

#### Implementation

```javascript
// File: src/utils/paraphrase/uploadQueue.js

export class UploadQueue {
  constructor(maxConcurrent = 3) {
    this.maxConcurrent = maxConcurrent;
    this.active = 0;
    this.queue = [];
  }

  async add(uploadFn) {
    // Wait if at capacity
    while (this.active >= this.maxConcurrent) {
      await new Promise((resolve) => this.queue.push(resolve));
    }

    this.active++;

    try {
      await uploadFn();
    } finally {
      this.active--;
      // Start next in queue
      const next = this.queue.shift();
      if (next) next();
    }
  }

  getStats() {
    return {
      active: this.active,
      queued: this.queue.length,
    };
  }
}
```

**Usage:**

```javascript
// In MultipleFileUpload.jsx
const uploadQueue = useRef(new UploadQueue(3)).current;

// Modified file selection handler
mapped.forEach((f, i) => {
  if (f.status === "idle") {
    uploadQueue.add(() => uploadFile(f.file, i));
  }
});
```

**Testing:**

- [ ] Upload 20 files, verify max 3 concurrent
- [ ] Monitor network tab, confirm rate limiting works
- [ ] Check files complete in order with 3 at a time

---

### 3. Proper Error Handling

**Problem:** Generic error messages don't help users  
**Impact:** Poor UX, increased support tickets

#### Implementation

```javascript
// File: src/utils/paraphrase/uploadErrors.js

export class UploadError extends Error {
  constructor(message, code, statusCode = null) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.isRetryable = false;
  }
}

export const parseUploadError = async (response) => {
  const statusCode = response.status;

  // Try to get error details from response
  let errorData;
  try {
    errorData = await response.json();
  } catch {
    errorData = {};
  }

  const errorMap = {
    401: {
      message: "Session expired. Please log in again.",
      code: "AUTH_EXPIRED",
      retryable: false,
    },
    403: {
      message: "You do not have permission to upload files.",
      code: "PERMISSION_DENIED",
      retryable: false,
    },
    413: {
      message: "File too large. Maximum 25MB allowed.",
      code: "FILE_TOO_LARGE",
      retryable: false,
    },
    415: {
      message: "Unsupported file type. Only PDF, DOCX, and TXT are allowed.",
      code: "UNSUPPORTED_TYPE",
      retryable: false,
    },
    429: {
      message: "Too many uploads. Please wait a moment and try again.",
      code: "RATE_LIMIT",
      retryable: true,
    },
    500: {
      message: "Server error occurred. Please try again.",
      code: "SERVER_ERROR",
      retryable: true,
    },
    503: {
      message: "Service temporarily unavailable. Please try again later.",
      code: "SERVICE_UNAVAILABLE",
      retryable: true,
    },
  };

  const errorInfo = errorMap[statusCode] || {
    message: errorData.message || "Upload failed. Please try again.",
    code: "UNKNOWN_ERROR",
    retryable: true,
  };

  const error = new UploadError(errorInfo.message, errorInfo.code, statusCode);
  error.isRetryable = errorInfo.retryable;

  return error;
};
```

**Usage:**

```javascript
// In uploadFile function
try {
  const res = await fetch(...);

  if (!res.ok) {
    const error = await parseUploadError(res);
    throw error;
  }

  // ... success logic
} catch (err) {
  const errorMessage = err instanceof UploadError
    ? err.message
    : 'Network error. Please check your connection.';

  updateFileStatus(idx, "error", 0, null, errorMessage);
}
```

**Testing:**

- [ ] Test each HTTP status code response
- [ ] Verify error messages are user-friendly
- [ ] Check network errors show appropriate message

---

### 4. File Validation Enhancement

**Problem:** Client-side validation only (easily bypassed)  
**Impact:** Security risk, malicious files could be uploaded

#### Implementation

```javascript
// File: src/utils/paraphrase/fileValidation.js

const VALID_MIME_TYPES = {
  "application/pdf": {
    extension: "pdf",
    signatures: [[0x25, 0x50, 0x44, 0x46]], // %PDF
  },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
    extension: "docx",
    signatures: [
      [0x50, 0x4b, 0x03, 0x04],
      [0x50, 0x4b, 0x05, 0x06],
    ], // PK (ZIP)
  },
  "text/plain": {
    extension: "txt",
    signatures: [], // Text files don't have fixed signatures
  },
};

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB

export const validateFile = async (file) => {
  const errors = [];

  // 1. Check file size
  if (file.size > MAX_FILE_SIZE) {
    errors.push("File must be ≤ 25 MB");
  }

  if (file.size === 0) {
    errors.push("File is empty");
  }

  // 2. Check MIME type
  if (!VALID_MIME_TYPES[file.type]) {
    errors.push("Unsupported file type. Only PDF, DOCX, and TXT are allowed.");
  }

  // 3. Check file extension
  const extension = file.name.split(".").pop()?.toLowerCase();
  const expectedExtension = VALID_MIME_TYPES[file.type]?.extension;

  if (extension !== expectedExtension) {
    errors.push(`File extension .${extension} doesn't match file type`);
  }

  // 4. Check file signature (magic bytes) - skip for text files
  if (file.type !== "text/plain") {
    const isValidSignature = await checkFileSignature(file);
    if (!isValidSignature) {
      errors.push("File appears to be corrupted or invalid");
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

const checkFileSignature = async (file) => {
  try {
    const arrayBuffer = await file.slice(0, 8).arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);

    const signatures = VALID_MIME_TYPES[file.type]?.signatures || [];

    return signatures.some((signature) =>
      signature.every((byte, index) => bytes[index] === byte),
    );
  } catch {
    return false;
  }
};

// Sanitize file name to prevent XSS
export const sanitizeFileName = (fileName) => {
  // Remove any HTML/script tags
  let clean = fileName.replace(/<[^>]*>/g, "");

  // Replace dangerous characters
  clean = clean.replace(/[<>:"|?*]/g, "_");

  // Limit length
  if (clean.length > 255) {
    const ext = clean.split(".").pop();
    const nameWithoutExt = clean.slice(0, clean.lastIndexOf("."));
    clean = nameWithoutExt.slice(0, 250 - ext.length) + "." + ext;
  }

  return clean;
};

// Generate unique file ID
export const generateFileId = (file) => {
  return `${file.name}-${file.size}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};
```

**Usage:**

```javascript
// In handleFilesSelected
const mapped = await Promise.all(
  incoming.map(async (file) => {
    const validation = await validateFile(file);

    if (!validation.valid) {
      return {
        id: generateFileId(file),
        file,
        status: "error",
        progress: 0,
        error: validation.errors[0], // Show first error
      };
    }

    return {
      id: generateFileId(file),
      file,
      fileName: sanitizeFileName(file.name),
      status: "idle",
      progress: 0,
      downloadUrl: null,
      error: null,
    };
  }),
);
```

**Testing:**

- [ ] Upload valid PDF → success
- [ ] Upload renamed .exe as .pdf → fails
- [ ] Upload 30MB file → fails with size error
- [ ] Upload file with `<script>` in name → sanitized
- [ ] Upload empty file → fails validation

---

### 5. Unique File ID System

**Problem:** Duplicate file names cause confusion  
**Impact:** Can't distinguish between files in state

#### Implementation

Already covered in `generateFileId` above. Key points:

```javascript
// Use ID as key, not index
{
  files.map((f) => (
    <div key={f.id}>
      {" "}
      {/* Not key={i} */}
      {f.fileName}
    </div>
  ));
}

// Update status by ID, not index
const updateFileStatus = (
  fileId,
  status,
  progress,
  downloadUrl = null,
  error = null,
) => {
  setFiles((fs) =>
    fs.map((f) =>
      f.id === fileId ? { ...f, status, progress, downloadUrl, error } : f,
    ),
  );
};
```

**Testing:**

- [ ] Upload 2 files with same name → both tracked correctly
- [ ] Remove one file → correct file removed
- [ ] Status updates → correct file updated

---

## Implementation Order

1. ✅ Create utility files first
   - `src/utils/paraphrase/fileUploadHelpers.js`
   - `src/utils/paraphrase/uploadQueue.js`
   - `src/utils/paraphrase/uploadErrors.js`
   - `src/utils/paraphrase/fileValidation.js`

2. ✅ Update `MultipleFileUpload.jsx`
   - Integrate FileURLManager
   - Integrate UploadQueue
   - Integrate validation
   - Update error handling
   - Add unique IDs

3. ✅ Test each fix independently

4. ✅ Integration testing

---

## Files to Create/Modify

### New Files

```
src/
  utils/
    paraphrase/
      fileUploadHelpers.js     [NEW]
      uploadQueue.js           [NEW]
      uploadErrors.js          [NEW]
      fileValidation.js        [NEW]
```

### Modified Files

```
src/
  components/
    tools/
      common/
        MultipleFileUpload.jsx  [MODIFY]
```

---

## Testing Checklist

### Memory Leak Tests

- [ ] Upload 10 files, close modal → memory stable
- [ ] Upload, download, close → URLs revoked
- [ ] Rapid open/close → no memory growth

### Rate Limiting Tests

- [ ] Upload 20 files → max 3 concurrent
- [ ] Network tab shows controlled requests
- [ ] Queue empties properly

### Error Handling Tests

- [ ] Mock 401 → "Session expired" message
- [ ] Mock 500 → "Server error" message
- [ ] Network offline → appropriate error
- [ ] Invalid file type → clear error

### Validation Tests

- [ ] Valid files pass all checks
- [ ] Invalid MIME type rejected
- [ ] File size > 25MB rejected
- [ ] Corrupted file detected
- [ ] XSS in filename sanitized
- [ ] Duplicate names handled

---

## Success Criteria

- [ ] No memory leaks after 100 file uploads
- [ ] Max 3 concurrent uploads maintained
- [ ] All error messages are user-friendly
- [ ] File validation catches common issues
- [ ] Unique IDs prevent confusion
- [ ] All tests passing
- [ ] Code review approved

---

## Design Patterns Used

1. **Manager Pattern** - FileURLManager centralizes URL lifecycle
2. **Queue Pattern** - UploadQueue manages concurrency
3. **Error Hierarchy** - Custom UploadError for type safety
4. **Validation Strategy** - Modular validation rules
5. **Factory Pattern** - generateFileId creates unique identifiers

---

## Estimated Time

- FileURLManager: 1 hour
- UploadQueue: 1.5 hours
- Error handling: 2 hours
- File validation: 3 hours
- Integration: 2 hours
- Testing: 3 hours

**Total: 12-13 hours**

---

## Next Phase

After completing Phase 0, proceed to Phase 1 (MVP) with confidence that the foundation is solid.
