# New Plagiarism API Data Structure - Implementation Plan

## Executive Summary

The backend now returns an enhanced plagiarism detection response with additional fields including:

- `overallSimilarity` (decimal 0-1)
- `paraphrasedSections` (detailed array with sources, text, similarity)
- `exactMatches` (array for exact copy matches)
- `sources` (all unique sources across all sections)
- `citations` (formatted citations in APA, MLA, Chicago)
- `language` (detected language info)
- Enhanced `summary` with `totalChunks` and `riskLevel`
- `paraphrasedPercentage` and `exactPlagiarismPercentage`
- `hasPlagiarism`, `needsReview` flags

## Current Architecture Analysis

### Data Flow

1. **Service Layer** (`plagiarismService.ts`):
   - `analyzePlagiarism()` fetches raw response
   - `normalizeResponse()` converts raw → `PlagiarismReport` type
   - Already handles `overallSimilarity` → `score` conversion

2. **Hook Layer**:
   - `usePlagiarismReport.ts`: Core hook that manages API calls, caching, state
   - `useGlobalPlagiarismCheck.js`: Adapter hook that transforms `PlagiarismReport` → legacy format (`score`, `results`)

3. **Component Layer**:
   - `PlagiarismTab.jsx`: Uses legacy format (`score`, `results`) - simple display
   - `PlagiarismCheckerContentSection/index.jsx`: Uses full `PlagiarismReport` - comprehensive display
   - `ReportSummary.tsx`: Displays summary stats
   - `ReportSectionList.tsx` + `ReportSectionItem.tsx`: Display sections with sources

### Current Type Definition (`src/types/plagiarism.ts`)

```typescript
interface PlagiarismReport {
  score: number; // ✅ Already mapped from overallSimilarity
  riskLevel: RiskLevel; // ✅ Already mapped from summary.riskLevel
  analyzedAt: string; // ✅ Already mapped from timestamp
  sections: PlagiarismSection[]; // ✅ Already mapped from paraphrasedSections
  summary: PlagiarismSummary; // ⚠️ Missing totalChunks
  flags: PlagiarismFlags; // ✅ Already mapped
  analysisId?: string; // ✅ Already mapped
}
```

## Gap Analysis

### Missing in Current Type System

1. **`sources`**: Array of all unique sources (not just per-section)
2. **`citations`**: Formatted citations (APA, MLA, Chicago)
3. **`language`**: Detected language information
4. **`exactMatches`**: Array of exact match sections
5. **`exactPlagiarismPercentage`**: Percentage of exact matches
6. **`summary.totalChunks`**: Total number of text chunks analyzed

### Missing in Normalization (`plagiarismService.ts`)

- `sources` array extraction
- `citations` array preservation
- `language` object preservation
- `exactMatches` array normalization
- `exactPlagiarismPercentage` mapping
- `summary.totalChunks` mapping

### UI Enhancement Opportunities

1. **PlagiarismTab.jsx**:
   - Currently shows simple score + results list
   - Could show: risk level badge, exact matches count, citations button

2. **ReportSummary.tsx**:
   - Could show: exact plagiarism percentage, total chunks, language detected
   - Could add: citations download/export

3. **ReportSectionItem.tsx**:
   - Already shows sources well
   - Could add: citation format selector, match type indicator

4. **New Components Needed**:
   - `CitationsPanel.tsx`: Display and export citations
   - `ExactMatchesList.tsx`: Show exact matches separately
   - `LanguageIndicator.tsx`: Show detected language
   - `AllSourcesList.tsx`: Show all unique sources in one place

## Implementation Strategy

> **📋 Architecture Note**: See `ARCHITECTURE_IMPROVEMENTS.md` for detailed design patterns and best practices. This plan follows separation of concerns, repository pattern, and other SOLID principles.

### Phase 1: Type System Updates (Foundation)

**Goal**: Extend types to support all new fields without breaking existing code

**Tasks**:

1. Update `src/types/plagiarism.ts`:
   - Add `Citation` interface (url, apa, mla, chicago)
   - Add `Language` interface (code, name, confidence)
   - Add `ExactMatch` interface (similar to PlagiarismSection)
   - Extend `PlagiarismSummary` with `totalChunks`
   - Extend `PlagiarismReport` with:
     - `sources?: PlagiarismSource[]` (all unique sources)
     - `citations?: Citation[]`
     - `language?: Language`
     - `exactMatches?: ExactMatch[]`
     - `exactPlagiarismPercentage?: number`
   - Add `RawPlagiarismResponse` interface for API response

**Files to Modify**:

- `src/types/plagiarism.ts`

**Breaking Changes**: None (all new fields are optional)

---

### Phase 2: Architecture Simplification (Essential Only)

**Goal**: Fix duplicate caching and separate concerns without over-engineering

**Tasks**:

1. **Create Cache Manager** (`src/services/cache/PlagiarismCacheManager.ts`):
   - Centralize caching logic (remove duplicate cache from hooks)
   - Simple module-level state (no classes)
   - TTL management

2. **Create Data Mapper** (`src/mappers/PlagiarismDataMapper.ts`):
   - Extract normalization logic from service
   - Pure functions for transformation
   - Map raw API response → PlagiarismReport

3. **Update Service Layer** (`src/services/plagiarismService.ts`):
   - Keep only API communication
   - Remove normalization (moved to mapper)
   - Use mapper for transformation

4. **Update Hook** (`src/hooks/usePlagiarismReport.ts`):
   - Use cache manager directly
   - Use service directly
   - Keep it simple

**Files to Create**:

- `src/services/cache/PlagiarismCacheManager.ts`
- `src/mappers/PlagiarismDataMapper.ts`

**Files to Modify**:

- `src/services/plagiarismService.ts` (simplify, use mapper)
- `src/hooks/usePlagiarismReport.ts` (use cache manager)

**Breaking Changes**: None (backward compatible)

---

### Phase 3: Legacy Adapter & Hook Updates

**Goal**: Maintain backward compatibility while exposing new data

**Tasks**:

1. **Create Legacy Adapter** (`src/adapters/LegacyPlagiarismAdapter.ts`):
   - Simple function to adapt `PlagiarismReport` → legacy format
   - Used by `useGlobalPlagiarismCheck` for backward compatibility
   - Easy to remove when legacy components updated

2. **Update `useGlobalPlagiarismCheck.js`**:
   - Use `LegacyPlagiarismAdapter` for backward compatibility
   - Keep existing `score` and `results` for legacy components
   - Add new computed values (optional, for new components):
     - `exactMatches` (from report.exactMatches)
     - `allSources` (from report.sources)
     - `citations` (from report.citations)
     - `language` (from report.language)
     - `exactPlagiarismPercentage` (from report.exactPlagiarismPercentage)
     - `totalChunks` (from report.summary.totalChunks)

**Files to Create**:

- `src/adapters/LegacyPlagiarismAdapter.ts`

**Files to Modify**:

- `src/hooks/useGlobalPlagiarismCheck.js` (use adapter, add new fields)

---

### Phase 4: UI Component Updates

#### 4.1 PlagiarismTab.jsx (Simple Sidebar Tab)

**Current**: Shows score + simple results list
**Enhancements**:

- Add risk level badge next to score
- Show exact matches count if > 0
- Add "View Citations" button/link
- Show language detected (small badge)

**Files to Modify**:

- `src/components/tools/paraphrase/actions/PlagiarismTab.jsx`

**New Dependencies**: None (use existing data from hook)

---

#### 4.2 ReportSummary.tsx (Main Report Summary)

**Current**: Shows overall score, risk level, stats
**Enhancements**:

- Add "Exact Plagiarism" stat card (if exactPlagiarismPercentage > 0)
- Show total chunks analyzed
- Add language indicator
- Add citations section (collapsible or separate panel)

**Files to Modify**:

- `src/components/plagiarism/ReportSummary.tsx`

---

#### 4.3 ReportSectionList.tsx & ReportSectionItem.tsx

**Current**: Shows paraphrased sections well
**Enhancements**:

- Add exact matches section (if exactMatches.length > 0)
- Show match type badge (paraphrased vs exact)
- Add citation format selector in section details

**Files to Modify**:

- `src/components/plagiarism/ReportSectionList.tsx`
- `src/components/plagiarism/ReportSectionItem.tsx`

---

#### 4.4 New Components (Optional - Phase 5)

**CitationsPanel.tsx**:

- Display citations in selected format (APA/MLA/Chicago)
- Copy to clipboard functionality
- Export as text file

**ExactMatchesSection.tsx**:

- Dedicated section for exact matches
- Similar UI to ReportSectionList but with "EXACT MATCH" badges

**AllSourcesView.tsx**:

- Show all unique sources in one place
- Filterable by similarity, match type, confidence
- Useful for comprehensive review

---

### Phase 5: PlagiarismCheckerContentSection Updates

**Current**: Main plagiarism checker page
**Enhancements**:

- Add tabs or sections for:
  - Overview (existing)
  - Exact Matches (new, if any)
  - All Sources (new)
  - Citations (new)
- Add language indicator in header
- Add export citations button

**Files to Modify**:

- `src/components/(primary-layout)/(plagiarism-checker)/PlagiarismCheckerContentSection/index.jsx`

---

## Implementation Order

### Step 1: Foundation (Types + Architecture) - **CRITICAL PATH**

1. ✅ Update `src/types/plagiarism.ts` with new interfaces
2. ✅ Create `PlagiarismCacheManager` (simple module-level state)
3. ✅ Create `PlagiarismDataMapper` (pure functions)
4. ✅ Refactor `plagiarismService.ts` to use mapper
5. ✅ Update `usePlagiarismReport.ts` to use cache manager
6. ✅ Test that existing components still work

**Estimated Time**: 2-3 hours
**Risk**: Low (backward compatible)

---

### Step 2: Legacy Support - **CRITICAL PATH**

1. ✅ Create `LegacyPlagiarismAdapter` (simple function)
2. ✅ Update `useGlobalPlagiarismCheck.js` to use adapter + add new fields
3. ✅ Test backward compatibility

**Estimated Time**: 1 hour
**Risk**: Low (additive changes, adapter maintains compatibility)

---

### Step 3: UI Enhancements - **FEATURE PATH**

1. ✅ Update `PlagiarismTab.jsx` with risk level, exact matches, citations
2. ✅ Update `ReportSummary.tsx` with new stats
3. ✅ Update `ReportSectionItem.tsx` with match type indicators
4. ✅ Update `PlagiarismCheckerContentSection` with new sections

**Estimated Time**: 4-6 hours
**Risk**: Medium (UI changes, needs testing)

---

### Step 4: New Components (Optional) - **ENHANCEMENT PATH**

1. ⚠️ Create `CitationsPanel.tsx`
2. ⚠️ Create `ExactMatchesSection.tsx`
3. ⚠️ Create `AllSourcesView.tsx`
4. ⚠️ Integrate into main page

**Estimated Time**: 6-8 hours
**Risk**: Low (new features, doesn't break existing)

---

## Testing Strategy

### Unit Tests

- Test `normalizeResponse()` with new data structure
- Test hook transformations
- Test type definitions

### Integration Tests

- Test that existing components still render correctly
- Test that new fields are accessible
- Test backward compatibility with old cached data

### Manual Testing Checklist

- [ ] PlagiarismTab shows new data correctly
- [ ] ReportSummary displays all new stats
- [ ] ReportSectionList handles exact matches
- [ ] Citations are accessible and copyable
- [ ] Language indicator shows correctly
- [ ] No console errors with new data
- [ ] Backward compatibility with cached reports

---

## Migration Considerations

### Cached Data

- Old cached reports won't have new fields (they're optional)
- Components should handle missing fields gracefully
- Consider cache invalidation strategy if needed

### Backward Compatibility

- All new fields are optional in types
- Existing components continue to work
- New features degrade gracefully if data missing

### API Versioning

- Backend may return old or new format
- Normalization handles both (defensive coding)
- Log warnings if expected fields missing

---

## Risk Assessment

| Risk                         | Impact | Probability | Mitigation                                  |
| ---------------------------- | ------ | ----------- | ------------------------------------------- |
| Breaking existing components | High   | Low         | All new fields optional, thorough testing   |
| Performance with large data  | Medium | Medium      | Lazy loading, pagination for sources        |
| Type mismatches              | Medium | Low         | TypeScript strict mode, comprehensive types |
| UI complexity                | Low    | Medium      | Progressive enhancement, optional features  |

---

## Success Criteria

1. ✅ All new backend fields are accessible in frontend
2. ✅ Existing components continue to work without changes
3. ✅ New data is displayed optimally in UI
4. ✅ No performance degradation
5. ✅ Type safety maintained
6. ✅ Backward compatibility preserved

---

## Next Steps

1. **Review this plan** with team
2. **Get approval** for approach
3. **Start with Phase 1** (Types + Service)
4. **Test incrementally** after each phase
5. **Deploy progressively** (can deploy Phase 1-2 without UI changes)

---

## Questions to Resolve

1. **Citations**: Should we show all citation formats or let user select?
   - **Recommendation**: Show selected format, allow switching

2. **Exact Matches**: Separate section or mixed with paraphrased?
   - **Recommendation**: Separate section for clarity

3. **Language**: How prominent should this be?
   - **Recommendation**: Small badge in summary, detailed in expanded view

4. **All Sources**: Is this needed or is per-section enough?
   - **Recommendation**: Optional feature, add if users request

5. **Performance**: How many sources can we handle?
   - **Recommendation**: Paginate if > 20 sources, lazy load details

---

## File Change Summary

### Files to Create (Architecture - Essential Only)

1. `src/services/cache/PlagiarismCacheManager.ts` - Cache manager (module-level state)
2. `src/mappers/PlagiarismDataMapper.ts` - Data transformation (pure functions)
3. `src/adapters/LegacyPlagiarismAdapter.ts` - Legacy format adapter (simple function)

### Files to Modify (Core)

1. `src/types/plagiarism.ts` - Add new types
2. `src/services/plagiarismService.ts` - Simplify, use mapper
3. `src/hooks/usePlagiarismReport.ts` - Refactor to use repository
4. `src/hooks/useGlobalPlagiarismCheck.js` - Use adapter, extend with new fields

### Files to Modify (UI Components)

5. `src/components/tools/paraphrase/actions/PlagiarismTab.jsx` - Enhance UI
6. `src/components/plagiarism/ReportSummary.tsx` - Add new stats
7. `src/components/plagiarism/ReportSectionList.tsx` - Handle exact matches
8. `src/components/plagiarism/ReportSectionItem.tsx` - Show match types
9. `src/components/(primary-layout)/(plagiarism-checker)/PlagiarismCheckerContentSection/index.jsx` - Add new sections

### Files to Create (UI - Optional)

10. `src/components/plagiarism/CitationsPanel.tsx` - Citations display
11. `src/components/plagiarism/ExactMatchesSection.tsx` - Exact matches list
12. `src/components/plagiarism/AllSourcesView.tsx` - All sources view

---

## Estimated Total Time

- **Phase 1 (Types)**: 1 hour
- **Phase 2 (Architecture - Essential)**: 2-3 hours
- **Phase 3 (Legacy Adapter)**: 1 hour
- **Phase 4 (UI Core)**: 4-6 hours
- **Phase 5 (UI Enhancements)**: 6-8 hours (optional)
- **Testing & Polish**: 2-3 hours

**Total**: 16-22 hours (with simplified architecture + optional features)
**Minimum Viable**: 8-11 hours (Phases 1-4 only, without optional UI)

**Note**: Simplified architecture adds only ~3-4 hours but provides:

- ✅ Fixes duplicate caching issue
- ✅ Better separation of concerns
- ✅ Easier to maintain long-term
- ✅ No over-engineering
