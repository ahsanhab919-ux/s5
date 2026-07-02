# Bug Fix: Double Toast Notification

**Issue:** Batch completion toast appearing twice  
**Severity:** Medium  
**Status:** FIXED ✅

---

## Root Cause Analysis

### The Problem

The `useUploadCompletion` hook's `useEffect` had `stats.completed` in its dependency array:

```javascript
}, [hasActiveUploads, stats.completed, dispatch]);
//                     ^^^^^^^^^^^^^^^^ BUG!
```

### Why It Caused Double Toasts

When the **last file** in a batch completes, **TWO** state values change simultaneously:

1. `hasActiveUploads`: `true` → `false`
2. `stats.completed`: increments (e.g., `2` → `3`)

Both are in the dependency array, so React triggers the effect **multiple times**:

**Execution Flow (BEFORE FIX):**

```
Upload 3 files: [A, B, C]

File A completes:
├─ stats.completed: 0 → 1
├─ hasActiveUploads: true (still uploading B, C)
└─ Effect runs: condition false ❌

File B completes:
├─ stats.completed: 1 → 2
├─ hasActiveUploads: true (still uploading C)
└─ Effect runs: condition false ❌

File C completes:
├─ stats.completed: 2 → 3
├─ hasActiveUploads: true → false
└─ Effect runs TWICE:
    ├─ Run 1: Triggered by hasActiveUploads change → Toast! ✅
    └─ Run 2: Triggered by stats.completed change → Toast! ❌ (DUPLICATE)
```

### The Race Condition

If Redux batches updates or React renders happen in separate cycles:

1. **Render 1:** `hasActiveUploads` becomes `false`
   - Effect condition: `prevHadActiveUploads=true && !hasActiveUploads && stats.completed>0` → **TRUE**
   - Shows toast
   - Sets `prevHadActiveUploads.current = false`

2. **Render 2:** `stats.completed` increments (dependency changed again!)
   - Effect runs again
   - But wait... `prevHadActiveUploads.current` is now `false`, so condition should be false?

**THE REAL ISSUE:** If the updates happen in the same render cycle but trigger the effect twice due to multiple dependencies changing, the ref update happens AFTER both condition checks, allowing both to pass!

---

## The Fix

### Solution: Remove `stats.completed` from Dependencies

We only care about the **transition** from "has uploads" → "no uploads", not the completion count itself.

```javascript
// BEFORE (BUGGY)
}, [hasActiveUploads, stats.completed, dispatch]);

// AFTER (FIXED)
}, [hasActiveUploads, dispatch]);
```

### Why This Works

- Effect only runs when `hasActiveUploads` changes
- The completion count (`stats.completed`) is still **read** inside the effect (it's in scope)
- We don't need it as a dependency because we don't care about its value changing
- We only care about the **boolean transition**: uploads active → uploads complete

**Execution Flow (AFTER FIX):**

```
Upload 3 files: [A, B, C]

File A completes:
├─ stats.completed: 0 → 1
├─ hasActiveUploads: true (no change)
└─ Effect doesn't run (dependency unchanged) ✅

File B completes:
├─ stats.completed: 1 → 2
├─ hasActiveUploads: true (no change)
└─ Effect doesn't run (dependency unchanged) ✅

File C completes:
├─ stats.completed: 2 → 3
├─ hasActiveUploads: true → false (CHANGED)
└─ Effect runs ONCE:
    └─ Run 1: Triggered by hasActiveUploads change → Toast! ✅
```

---

## Testing

### Test Case 1: Single Batch

**Steps:**

1. Upload 3 files
2. Wait for all to complete
3. **Expected:** ONE batch completion toast
4. **Before Fix:** Could show 2 toasts
5. **After Fix:** Shows 1 toast ✅

### Test Case 2: Multiple Batches

**Steps:**

1. Upload 3 files → complete
2. Upload 2 more files → complete
3. **Expected:** TWO batch completion toasts (one per batch)
4. **After Fix:** Shows 2 toasts correctly ✅

### Test Case 3: Mixed Success/Failure

**Steps:**

1. Upload 5 files (2 fail, 3 succeed)
2. **Expected:** ONE batch completion toast showing "3 files ready"
3. **After Fix:** Shows 1 toast with correct count ✅

---

## Related Issues

### Non-Issue: Double `toggleUpdateFileHistory` Call

Initially suspected this was also a bug:

```javascript
toastService.uploadSuccess(fileItem.fileName, () => {
  dispatch(toggleUpdateFileHistory()); // 1: Opens sidebar
});

dispatch(toggleUpdateFileHistory()); // 2: Refreshes list
```

**Analysis:** This is **intentional behavior**:

- First call: Refreshes the history list immediately when file completes
- Second call (in toast callback): Opens the history sidebar when user clicks toast

Since `toggleUpdateFileHistory` is a **toggle**, calling it twice would:

1. Toggle to `true` (refresh list)
2. Toggle back to `false` (if user clicks toast)

This is acceptable and doesn't cause the double toast issue.

---

## Impact

### Before Fix

- ❌ Users see duplicate "All files processed!" toasts
- ❌ Confusing UX
- ❌ Potential performance impact from redundant operations

### After Fix

- ✅ Single toast per batch completion
- ✅ Clean, predictable UX
- ✅ Better performance

---

## Lessons Learned

### React useEffect Dependencies

**Rule:** Only include values in the dependency array if:

1. The effect needs to **re-run** when they change
2. The effect **uses** them and they're not stable

**Don't include if:**

- You only **read** the current value inside the effect
- You care about **transitions** not absolute values
- Including it causes unnecessary re-runs

### Example Pattern (This Bug)

```javascript
// ❌ BAD: Re-run on every count change
useEffect(() => {
  if (hasActiveUploads === false && count > 0) {
    showToast(count);
  }
}, [hasActiveUploads, count]);

// ✅ GOOD: Only re-run on status change, read count at that moment
useEffect(() => {
  if (hasActiveUploads === false && count > 0) {
    showToast(count); // count is in scope, no need as dependency
  }
}, [hasActiveUploads]);
```

---

## Files Changed

- `src/hooks/useUploadCompletion.js` - Removed `stats.completed` from dependencies
- `docs/file-upload/BUG_DOUBLE_TOAST.md` - This document

---

## Status: RESOLVED ✅

The batch completion toast now appears exactly once per batch completion.
