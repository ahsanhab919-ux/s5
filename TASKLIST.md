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
  - [ ] Review PR #14: Implement download in MediaCanvas
  - [ ] Review PR #13: Implement media download in MediaCanvasModal
  - *Note: PR #13 and #14 seem to address similar functionality. Need to determine which one to proceed with.*

- **Documentation**:
  - [ ] PR #4: Replace academic analysis with developer-focused README
  - [ ] PR #3: Add docstrings to strengthened types

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
