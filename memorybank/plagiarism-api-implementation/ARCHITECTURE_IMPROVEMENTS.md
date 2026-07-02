# Plagiarism API - Simplified Architecture Improvements

## Current Architecture Issues

### 🔴 Critical Issues

1. **Duplicate Caching (DRY Violation)**
   - `PlagiarismRequestManager` singleton has its own cache
   - `usePlagiarismReport` hook has its own cache in `useRef`
   - Two sources of truth = potential inconsistencies

2. **Mixed Concerns**
   - Service layer mixes API calls + normalization + error handling
   - Hooks mix state management + caching + data transformation
   - No clear separation of responsibilities

3. **Inconsistent Usage**
   - Old `PlagiarismRequestManager` singleton exists but unused by new hooks
   - Two different code paths for same functionality

---

## Simplified Architecture (Only What's Needed)

### Layer Structure

```
┌─────────────────────────────────────────────────────────┐
│                    Presentation Layer                    │
│  (Components: PlagiarismTab, ReportSummary, etc.)       │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│                    Hook Layer                            │
│  (usePlagiarismReport, useGlobalPlagiarismCheck)         │
│  - State Management Only                                  │
│  - Uses Cache Manager + Service                           │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│              Service Layer                               │
│  (plagiarismService.ts)                                  │
│  - API Communication Only                                │
│  - Uses Data Mapper for transformation                   │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│           Supporting Utilities                           │
│  - Cache Manager (singleton via module)                  │
│  - Data Mapper (transformation)                          │
│  - Legacy Adapter (backward compatibility)               │
└──────────────────────────────────────────────────────────┘
```

---

## Essential Patterns Only

### 1. **Cache Manager** ✅ (Solves duplicate caching)

**Why**: Eliminates duplicate cache logic between hook and old manager

```typescript
// src/services/cache/PlagiarismCacheManager.ts
import type { PlagiarismReport } from "@/types/plagiarism";

interface CacheEntry {
  report: PlagiarismReport;
  timestamp: number;
}

// Module-level state (singleton pattern via module scope)
const cache = new Map<string, CacheEntry>();
const TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get cached report by key
 */
export const getCachedReport = (key: string): PlagiarismReport | null => {
  const entry = cache.get(key);
  if (!entry) return null;

  if (Date.now() - entry.timestamp > TTL) {
    cache.delete(key);
    return null;
  }

  return entry.report;
};

/**
 * Cache a report with key
 */
export const setCachedReport = (
  key: string,
  report: PlagiarismReport,
): void => {
  cache.set(key, {
    report,
    timestamp: Date.now(),
  });
};

/**
 * Clear all cached reports
 */
export const clearCache = (): void => {
  cache.clear();
};

/**
 * Cleanup expired entries
 */
export const cleanupExpiredEntries = (): void => {
  const now = Date.now();
  for (const [key, entry] of cache.entries()) {
    if (now - entry.timestamp > TTL) {
      cache.delete(key);
    }
  }
};

// Setup periodic cleanup (only in browser)
if (typeof window !== "undefined") {
  setInterval(cleanupExpiredEntries, 60000); // Every minute
}
```

**Benefits**:

- Single source of truth for caching
- Eliminates duplicate cache logic
- Simple and maintainable

---

### 2. **Data Mapper** ✅ (Separates transformation)

**Why**: Keeps service layer clean, makes transformation testable

```typescript
// src/mappers/PlagiarismDataMapper.ts
import type {
  PlagiarismReport,
  RawPlagiarismResponse,
  RiskLevel,
} from "@/types/plagiarism";

/**
 * Convert similarity value (0-1 or 0-100) to percentage (0-100)
 */
const mapScore = (similarity: number | null | undefined): number => {
  if (typeof similarity !== "number" || Number.isNaN(similarity)) return 0;
  if (similarity > 1) {
    return Math.round(Math.max(0, Math.min(similarity, 100)));
  }
  return Math.round(Math.max(0, Math.min(similarity * 100, 100)));
};

/**
 * Map risk level string to RiskLevel type
 */
const mapRiskLevel = (risk?: string): RiskLevel => {
  const normalized = (risk ?? "").toUpperCase();
  if (normalized === "HIGH") return "HIGH";
  if (normalized === "LOW" || normalized === "MINIMAL") return "LOW";
  return "MEDIUM";
};

/**
 * Map sections array
 */
const mapSections = (
  sections?: RawParaphrasedSection[],
): PlagiarismSection[] => {
  if (!sections) return [];
  return sections.map((section) => ({
    similarity: mapScore(section?.similarity),
    excerpt: section?.text ?? "",
    span: {
      start: section?.startChar ?? null,
      end: section?.endChar ?? null,
    },
    sources:
      section?.sources?.map((source) => ({
        title: source?.title ?? "Unknown source",
        url: source?.url ?? "",
        snippet: source?.snippet ?? "",
        matchType: source?.matchType ?? "paraphrased",
        confidence: (source?.confidence ?? "unknown").toLowerCase(),
        similarity: mapScore(source?.similarity),
        isPlagiarism: Boolean(source?.isPlagiarism),
        reason: source?.reason ?? "",
      })) ?? [],
  }));
};

/**
 * Maps raw API response to normalized PlagiarismReport
 */
export const mapToReport = (raw: RawPlagiarismResponse): PlagiarismReport => {
  const sections = mapSections(raw.paraphrasedSections);
  const score = mapScore(raw.overallSimilarity);

  return {
    score,
    riskLevel: mapRiskLevel(raw.summary?.riskLevel),
    analyzedAt: raw.timestamp ?? new Date().toISOString(),
    sections,
    exactMatches: mapSections(raw.exactMatches as RawParaphrasedSection[]),
    summary: {
      totalChunks: raw.summary?.totalChunks ?? sections.length,
      paraphrasedCount: raw.summary?.paraphrasedCount ?? sections.length,
      paraphrasedPercentage:
        raw.paraphrasedPercentage !== undefined
          ? mapScore(raw.paraphrasedPercentage)
          : sections.length > 0
            ? Math.round(
                (sections.length /
                  (raw.summary?.totalChunks ?? sections.length)) *
                  100,
              )
            : 0,
      exactMatchCount: raw.summary?.exactMatchCount ?? 0,
    },
    flags: {
      hasPlagiarism: Boolean(raw.hasPlagiarism ?? score >= 70),
      needsReview: Boolean(raw.needsReview ?? score >= 50),
    },
    sources:
      raw.sources?.map((source) => ({
        title: source.title ?? "Unknown source",
        url: source.url ?? "",
        snippet: source.snippet ?? "",
        matchType: source.matchType ?? "paraphrased",
        confidence: (source.confidence ?? "unknown").toLowerCase(),
        similarity: mapScore(source.similarity),
        isPlagiarism: Boolean(source.isPlagiarism),
        reason: source.reason ?? "",
      })) ?? [],
    citations:
      raw.citations?.map((citation) => ({
        url: citation.url ?? "",
        apa: citation.apa ?? "",
        mla: citation.mla ?? "",
        chicago: citation.chicago ?? "",
      })) ?? [],
    language: raw.language
      ? {
          code: raw.language.code ?? "eng",
          name: raw.language.name ?? "Unknown",
          confidence: raw.language.confidence ?? 1,
        }
      : undefined,
    exactPlagiarismPercentage: mapScore(raw.exactPlagiarismPercentage),
    analysisId: raw.analysisId,
  };
};
```

**Benefits**:

- Keeps service layer focused on API calls only
- Easy to test transformation logic
- Single place to update when API changes

---

### 3. **Legacy Adapter** ✅ (Backward compatibility)

**Why**: Existing components use legacy format, need smooth migration

```typescript
// src/adapters/LegacyPlagiarismAdapter.ts
import type { PlagiarismReport } from "@/types/plagiarism";

interface LegacyResult {
  percent: number;
  source: string;
  chunkText: string;
  sources: PlagiarismSource[];
  span: { start: number | null; end: number | null };
}

interface LegacyFormat {
  score: number | null;
  results: LegacyResult[];
}

/**
 * Adapts modern PlagiarismReport to legacy format
 * Used for backward compatibility with existing components
 */
export const adaptToLegacy = (
  report: PlagiarismReport | null,
): LegacyFormat => {
  if (!report) {
    return { score: null, results: [] };
  }

  return {
    score: report.score,
    results: report.sections.map((section) => ({
      percent: section.similarity,
      source: section.sources?.[0]?.title ?? "Unknown source",
      chunkText: section.excerpt,
      sources: section.sources,
      span: section.span,
    })),
  };
};
```

**Benefits**:

- Allows gradual migration of components
- Easy to remove once all components updated

---

## Simplified File Structure

```
src/
├── services/
│   ├── plagiarismService.ts          # API communication only
│   └── cache/
│       └── PlagiarismCacheManager.ts # Cache manager
│
├── mappers/
│   └── PlagiarismDataMapper.ts       # Data transformation
│
├── adapters/
│   └── LegacyPlagiarismAdapter.ts     # Legacy format adapter
│
├── hooks/
│   ├── usePlagiarismReport.ts        # Uses cache + service
│   └── useGlobalPlagiarismCheck.js   # Uses adapter
│
└── types/
    └── plagiarism.ts                 # Type definitions
```

**That's it!** No repository, no factory, no observer, no strategy - just what's needed.

---

## Updated Service Layer

```typescript
// src/services/plagiarismService.ts
import { mapToReport } from "@/mappers/PlagiarismDataMapper";
import type { PlagiarismReport } from "@/types/plagiarism";

// ... error classes ...

export const analyzePlagiarism = async ({
  text,
  token,
  signal,
  baseUrl = DEFAULT_API_BASE,
}: AnalyzePlagiarismParams): Promise<PlagiarismReport> => {
  // ... API call logic ...

  const raw = await response.json();
  return mapToReport(raw); // Use mapper for transformation
};
```

---

## Updated Hook Layer

```typescript
// src/hooks/usePlagiarismReport.ts
import { useState, useCallback } from "react";
import { useSelector } from "react-redux";
import * as cacheManager from "@/services/cache/PlagiarismCacheManager";
import { analyzePlagiarism } from "@/services/plagiarismService";
import type { PlagiarismReport } from "@/types/plagiarism";

const normalizeKey = (text: string) => text.trim().toLowerCase();

export const usePlagiarismReport = (text: string) => {
  const accessToken = useSelector((state: any) => state?.auth?.accessToken);
  const [state, setState] = useState({
    loading: false,
    report: null as PlagiarismReport | null,
    error: null as string | null,
    fromCache: false,
  });

  const runScan = useCallback(
    async (options?: { forceRefresh?: boolean }) => {
      if (!text?.trim()) {
        setState((prev) => ({ ...prev, loading: false, report: null }));
        return;
      }

      const key = normalizeKey(text);

      // Check cache first
      if (!options?.forceRefresh) {
        const cached = cacheManager.getCachedReport(key);
        if (cached) {
          setState({
            loading: false,
            report: cached,
            error: null,
            fromCache: true,
          });
          return;
        }
      }

      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const report = await analyzePlagiarism({
          text,
          token: accessToken,
        });

        // Cache the result
        cacheManager.setCachedReport(key, report);

        setState({
          loading: false,
          report,
          error: null,
          fromCache: false,
        });
      } catch (error) {
        setState({
          loading: false,
          report: null,
          error: error instanceof Error ? error.message : "Unknown error",
          fromCache: false,
        });
      }
    },
    [text, accessToken],
  );

  return {
    loading: state.loading,
    report: state.report,
    error: state.error,
    fromCache: state.fromCache,
    triggerCheck: runScan,
    manualRefresh: () => runScan({ forceRefresh: true }),
    reset: () =>
      setState({ loading: false, report: null, error: null, fromCache: false }),
  };
};
```

---

## Updated useGlobalPlagiarismCheck

```typescript
// src/hooks/useGlobalPlagiarismCheck.js
import { useMemo } from "react";
import usePlagiarismReport from "./usePlagiarismReport";
import { adaptToLegacy } from "@/adapters/LegacyPlagiarismAdapter";

const useGlobalPlagiarismCheck = (text) => {
  const {
    loading,
    report,
    error,
    fromCache,
    triggerCheck,
    manualRefresh,
    reset,
  } = usePlagiarismReport(text ?? "");

  // Adapt to legacy format for backward compatibility
  const legacyData = useMemo(() => {
    return adaptToLegacy(report);
  }, [report]);

  return {
    loading,
    score: legacyData.score,
    results: legacyData.results,
    error,
    fromCache,
    report, // Also expose full report for new components
    reset,
    triggerCheck,
    manualRefresh: () => manualRefresh(),
  };
};

export default useGlobalPlagiarismCheck;
```

---

## What We Removed (And Why)

### ❌ Repository Pattern

- **Why removed**: Adds unnecessary abstraction layer
- **Alternative**: Hooks use cache manager + service directly
- **Benefit**: Simpler, fewer files, easier to understand

### ❌ Factory Pattern

- **Why removed**: Components can access report properties directly
- **Alternative**: Components use `report.score`, `report.sections`, etc.
- **Benefit**: Less code, more direct

### ❌ Strategy Pattern for Citations

- **Why removed**: Simple function is enough
- **Alternative**: `formatCitation(citation, 'apa')` function
- **Benefit**: Simpler, no need for strategy map

### ❌ Observer Pattern

- **Why removed**: React hooks already handle state updates
- **Alternative**: Components use hooks, React handles updates
- **Benefit**: Uses built-in React patterns

---

## Simple Citation Formatting (If Needed)

```typescript
// src/utils/citationFormatter.ts
import type { Citation } from "@/types/plagiarism";

type CitationFormat = "apa" | "mla" | "chicago";

export const formatCitation = (
  citation: Citation,
  format: CitationFormat = "apa",
): string => {
  switch (format) {
    case "apa":
      return citation.apa;
    case "mla":
      return citation.mla;
    case "chicago":
      return citation.chicago;
    default:
      return citation.apa;
  }
};

export const formatAllCitations = (
  citations: Citation[],
  format: CitationFormat = "apa",
): string => {
  return citations.map((c) => formatCitation(c, format)).join("\n\n");
};
```

That's it - just a simple utility function, no pattern needed.

---

## Migration Strategy

### Phase 1: Add Cache Manager (Low Risk)

1. Create `PlagiarismCacheManager.ts`
2. Update `usePlagiarismReport` to use it
3. Remove duplicate cache from hook
4. Test backward compatibility

### Phase 2: Extract Mapper (Low Risk)

1. Create `PlagiarismDataMapper.ts`
2. Move normalization from service to mapper
3. Update service to use mapper
4. Test data transformation

### Phase 3: Add Adapter (Low Risk)

1. Create `LegacyPlagiarismAdapter.ts`
2. Update `useGlobalPlagiarismCheck` to use adapter
3. Test legacy components still work

**Total**: 3 simple files, ~200 lines of code, maintains all functionality

---

## Benefits of Simplified Approach

1. ✅ **Less Code**: 3 files instead of 7
2. ✅ **Easier to Understand**: No complex patterns
3. ✅ **Easier to Maintain**: Fewer abstractions
4. ✅ **Still Solves Problems**: Fixes duplicate caching, separation of concerns
5. ✅ **Backward Compatible**: Adapter maintains compatibility
6. ✅ **Testable**: Each piece can be tested independently

---

## Summary

### What We Keep

- ✅ **Cache Manager**: Solves duplicate caching
- ✅ **Data Mapper**: Separates transformation
- ✅ **Legacy Adapter**: Backward compatibility

### What We Remove

- ❌ Repository (unnecessary abstraction)
- ❌ Factory (components access data directly)
- ❌ Strategy (simple function is enough)
- ❌ Observer (React hooks handle this)

**Result**: Simple, maintainable architecture that solves real problems without over-engineering.
