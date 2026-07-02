# Shothik v4 — Local Rebuild Findings

_Generated from a clean clone of `main` (shothikai-platform/shothik-v4)._

## Summary

The repo was cloned and the frontend was built locally. **The build fails to compile**
with **21 syntax errors**, all caused by a single root issue (see below). This is the
defect that has kept the build and CI red for months. The fix is mechanical and low-risk.

Environment used: Node v20.20, npm 10.8. Frontend deps install cleanly (`npm ci`, ~982 packages).

---

## ROOT CAUSE: Botched "remove console statements" edit (21 files)

An automated edit removed `console.log(` / `console.error(` **opening calls** but left the
**argument list and closing `);`** behind. This produced orphaned expressions and dangling
`)` tokens, which the compiler rejects.

### Example — `src/utils/presentation/presentationHistoryDataParser.js:709`
```js
    if (extractedMetadata) {
      parsedState.title = extractedMetadata.title;
      parsedState.totalSlides = extractedMetadata.totalSlides;
    }

      logsCount: parsedLogs.length,      // <-- orphaned: console.log({ ... }) opener was deleted
      slidesCount: parsedSlides.length,
      status: parsedState.status,
      title: parsedState.title,
    });                                  // <-- dangling close
```

### Example — `src/components/tools/humanize/HumanizedContend.jsx:143`
```js
        ( => output.aiPercentage)),     // <-- mangled arrow fn left by the bad codemod
          "RESTORED SCORES");
```

### How to fix
For each location below, either:
1. **Restore** the `console.log(` / `console.error(` opener that was removed, **or**
2. **Delete** the orphaned argument lines + dangling `);` entirely (cleaner).

A careful find/replace or a manual pass over these 21 spots resolves the entire build.

---

## The 21 broken files (file : approx. line)

```
src/app/(primary-layout)/agents/share-agent/[shareId]/page.jsx:54
src/app/(primary-layout)/agents/shared-sheet/[shareId]/page.jsx:355
src/components/(primary-layout)/(grammar-checker-page)/GrammarCheckerContentSection/index.jsx:424
src/components/(primary-layout)/(home-v2-page)/(home-components)/new-components/InteractiveAgentDemo.jsx:148
src/components/(primary-layout)/(marketing-automation-page)/AIMedia/AvatarsSection.tsx:165
src/components/(primary-layout)/(marketing-automation-page)/AIMedia/SmartAssetsSection.tsx:73
src/components/(primary-layout)/(marketing-automation-page)/Canvas.tsx:113
src/components/(primary-layout)/(marketing-automation-page)/Dashboard/index.tsx:121
src/components/(primary-layout)/(marketing-automation-page)/FacebookAccountSelectionScreen.tsx:301
src/components/(primary-layout)/(plagiarism-checker)/PlagiarismCheckerContentSection/index.jsx:62
src/components/(primary-layout)/(summarize-page)/SummarizeContentSection/index.jsx:495
src/components/presentation/InputAreas.jsx:79
src/components/presentation/PresentationAgentPageV2.jsx:97
src/components/presentation/PreviewPanel.jsx:90
src/components/sheet/SheetChatArea.jsx:782
src/components/tools/humanize/HumanizedContend.jsx:143
src/components/tools/research/ResearchContentWithReferences.jsx:71
src/hooks/useResearchStream.js:537
src/hooks/useStreamingLogs.ts:76
src/lib/nativePresentationExporter.ts:228
src/utils/presentation/presentationHistoryDataParser.js:709
```

---

## Other findings

- **Mixed package managers:** both `package-lock.json` and `pnpm-lock.yaml` + `pnpm-workspace.yaml`
  are committed. Pick one (the lockfiles will drift and break CI otherwise).
- **Dependency vulnerabilities:** `npm ci` reports **30 vulnerabilities (2 critical, 16 high)**.
  **Next.js 16.0.7** is flagged with a known security advisory — upgrade to a patched release.
- **CI checks not in repo:** the failing `Code Quality` / `Analyze` / `test` checks are NOT in
  `.github/workflows/` (only `build_nlp_service.yml` and `playwright.yml` exist). They come from
  external bot/app automation, which is why `main` shows perpetual red independent of code.
- **`.env.example` was incomplete** (1 variable). A complete version covering all **25** referenced
  variables has been written to `.env.example` in this clone.
- **Backend AI services** (`backend-services/nlp-inference-service`, `paraphrase-service`) require
  heavy ML deps (PyTorch, transformers, spaCy, ctranslate2, fasttext) and downloaded models;
  the Dockerfile currently disables T5. These cannot be fully run without the models + secrets.

## How to build locally (after fixing the 21 errors)

```bash
npm ci
cp .env.example .env.local   # fill in real values
npm run build                # next build
npm run dev                  # http://localhost:3000
```
