# Shothik v4 - Project Task List

## 🟢 Recently Completed
- **Authentication**:
  - [x] Implement token validation in AuthService (PR #12)
  - [x] Add authentication to Research Chat API (PR #6)
- **Agents & Files**:
  - [x] Combine upload states for all agents (Sheets, Research) (PR #8)
  - [x] Add toast notification for sheet creation failures (PR #11)
- **Marketing Automation**:
  - [x] Add Reports card navigation to AIInsights (PR #9)
  - [x] Implement save to ad functionality in MediaCanvas (PR #10)

## 🟡 In Progress / To Review
- **Media Canvas**:
    - [x] PR #14: Implement download in MediaCanvas (page-level view rendered by the `/marketing-automation/canvas/[projectId]/media/[adId]` route)
  - [x] PR #13: MediaCanvasModal — resolved via PR #14. The e2e spec (`e2e/media-canvas-download.spec.ts`) targets the MediaCanvas page, so the download is implemented there; the modal does not need a separate implementation.
  - *Decision: Proceeded with PR #14 (MediaCanvas). `handleDownload` fetches the media blob and saves it as `{headline}-media-{index}.{ext}` (e.g. `Test Ad-media-1.jpg`), matching the e2e test.*
- **Documentation**:
    - [x] PR #4: README is developer-focused (Tech Stack, Repo Structure, Getting Started, Env Vars, CI/CD)
  - [x] PR #3: Add TSDoc docstrings to strengthened types (`src/types/campaign.ts`)

## 🔴 Priority Issues / Next Steps
1. **Verify Paraphrase Service**:
   - Previous context indicated socket connection issues.
   - Status needs to be re-verified after recent merges.
2. **Test Research Chat Auth**:
   - Ensure the new `AuthService` validation works with the frontend chat components.
3. **Validate Agent Uploads**:
   - specific test: Upload a file in Research Agent and Sheet Agent to confirm the "combined state" logic works as expected.

## 📝 Notes
- The "staticv4" branch reference from user instructions is treated as `main` for this workspace.
- All core feature branches have been merged into `main`.
