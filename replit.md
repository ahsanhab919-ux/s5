# Shothik AI v3

## Overview

Shothik AI is a comprehensive AI-powered platform for digital marketing automation and content creation. The platform provides two main feature sets:

1. **Marketing Automation** - End-to-end Meta (Facebook/Instagram) advertising campaign management with AI-powered URL analysis, campaign canvas, media generation, and direct publishing to Meta platforms.

2. **Content Tools** - AI writing utilities including paraphrasing, AI humanization (bypassing AI detectors), plagiarism detection, grammar checking, translation, and summarization.

3. **Academic Writing Studio** - PaperDebugger-inspired academic writing tool with:
   - Rich text editor with TipTap and floating BubbleMenu for inline AI actions
   - Inline text processing (Paraphrase, Humanize, Grammar Fix) via sidebar or context menu
   - Diff preview with visual before/after comparison and Accept/Reject buttons
   - AI Detector integration with probability scoring in the Review tab
   - Tabbed sidebar UI (AI Actions / Review) with academic-focused design
   - Selection-persistent processing using selectionRef for reliable inline editing
   - **Week 2 Critique & Scoring Features:**
     - Real-time Flesch-Kincaid readability scoring (Flesch Reading Ease + Grade Level)
     - Writing statistics (word count, sentences, paragraphs, avg sentence length)
     - Academic tone score (composite of vocabulary, passive voice, readability)
     - Passive voice detection with percentage indicator
     - Complex word detection (3+ syllables) with examples
     - Hedging language detection with usage counts
     - All analysis updates in real-time with 500ms debounce
   - **Week 3 Advanced Review Features:**
     - Word choice analyzer detecting weak words (very, really, thing) with yellow badges
     - Informal language detection (contractions, casual words) with orange badges
     - Word repetition detection for words used 3+ times
     - Sentence variety analysis with short/medium/long breakdown and variety score
     - Citation format helper with APA 7th, MLA 9th, Chicago 17th templates
     - Templates provided for book, journal, and website citations
   - **Week 4 Citation & Research Features:**
     - Citation Lookup: Search CrossRef (academic papers) and Open Library (books)
     - Auto-detect DOI and ISBN patterns for direct lookup
     - Format citations in APA, MLA, or Chicago style with one click
     - Copy formatted citations to clipboard
     - DOI links for journal articles
     - Reference List Generator: Save citations and build bibliography
     - Export all references with "Copy All" button
     - Duplicate detection prevents adding same source twice
     - Writing Templates: Pre-built structures for Research Paper, Essay, Thesis Chapter, Literature Review, Lab Report
     - Export with References: Export to DOCX/HTML/TXT with formatted bibliography included
   - **Day 5-6 Onboarding Features:**
     - 5-step guided tour using Driver.js (Editor → AI Tools → Review → Citations → Export)
     - Sample thesis introduction document loaded during tour
     - First-time user detection via localStorage to auto-trigger tour
     - "Take a Tour" button in header to replay onboarding anytime
   - **Day 7 Paywall Features:**
     - Usage limits for free tier (3 AI actions/day, TXT export only)
     - Upgrade modal comparing Free vs Academic Pro ($9/month)
     - Usage banner showing remaining AI actions
     - Pro badges on premium features (DOCX/HTML export, AI detection)
   - **Production Security (Dec 2024):**
     - Backend-validated usage tracking via `useWritingStudioLimits` hook
     - Feature enforcement levels documented in hook:
       - `backend`: Word limits via /uses-limit API (paraphrase, grammar, summarize, humanize)
       - `subscription`: Pro required via user.package (AI detector, plagiarism, DOCX/HTML export)
       - `auth_only`: Login required (citations - uses external APIs)
       - `none`: Always allowed (TXT export)
     - Removed localStorage-based paywall (security vulnerability)
   - **Code Refactoring (Dec 2024):**
     - Extracted WritingStudioContent.jsx from ~2258 to 1164 lines
     - Constants (AI_TOOLS, PARAPHRASE_MODES, WRITING_TEMPLATES) moved to `./constants/index.js`
     - UI components extracted to `./components/`:
       - DiffPreview.jsx - Before/after text comparison
       - WritingTemplates.jsx - Academic template selector
       - ReviewPanels.jsx - WritingAnalysisPanel, CitationFormatHelper, CitationLookup, ReferenceListPanel, PlagiarismCheckPanel, AIScorePanel
   - **TypeScript & SSR Hardening (Dec 23, 2024):**
     - SSR fixes in API clients (api.ts, api-payment.ts, api-client.ts) - localStorage wrapped with typeof window checks
     - Removed hardcoded IP fallback from plagiarismService.ts (security fix)
     - Converted services to TypeScript with custom error classes:
       - ai-detector.service.ts (AIDetectorServiceError)
       - grammar-checker.service.ts (GrammarServiceError)
       - paraphrase.service.ts (ParaphraseServiceError + AbortSignal support)
     - Converted useWritingStudioLimits.js to TypeScript with explicit interfaces
     - Fixed syntax errors in ParaphraseContend.jsx (broken console.log statements)
   - **Paraphrase Tool Production Hardening (Dec 23, 2024):**
     - Fixed 8 parsing errors from broken console.log statements across 6 files (OutputBotomNavigation.jsx, ParaphraseOutput.jsx, UserInputBox.jsx, usePlagiarismReport.ts, downloadfile.js, EditableOutput.jsx)
     - Fixed TipTap duplicate extension warnings by configuring StarterKit to disable built-in hardBreak/link before adding standalone extensions
     - Fixed AuthProvider hydration mismatch with typeof window guard on localStorage access
     - Fixed Meta Pixel null warning with proper env var validation and SSR-safe initialization in FacebookPixel.jsx and fbconfig.js
     - Paraphrase route now returns HTTP 200 and renders correctly

4. **AI Agents** - Slide generation, data analysis/sheet generation, and deep research capabilities with real-time streaming.

The application is a Next.js 16 frontend that communicates with a separate backend API at `api-qa.shothik.ai`.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Framework
- **Next.js 16** with App Router for routing and server components
- **TypeScript** with relaxed strict mode (noImplicitAny disabled)
- **Tailwind CSS v4** for styling with CSS variables for theming

### State Management
- **Redux Toolkit** for global application state (auth, analytics, upload queues, slide editing, research chats)
- **React Query (TanStack Query)** for server state and API data caching
- **RTK Query** for some API endpoints (presentation, research chat APIs)

### UI Component Strategy
- **Radix UI primitives** wrapped with **shadcn/ui** components (new-york style)
- **Framer Motion** for animations
- **Tiptap** for rich text editing in paraphrase and content tools
- **Monaco Editor** for code editing features

### Key Architectural Patterns

1. **Service Layer Pattern** - Business logic lives in `/src/services/` (e.g., `marketing-automation.service.ts`, `plagiarism.service.ts`, `uploadService.js`)

2. **Custom Hooks for Features** - Complex features use custom hooks (e.g., `/src/hooks/presentation/` for slide editing, `/src/hooks/useAutoFreeze.js` for paraphrase)

3. **Redux Slices per Feature** - Each major feature has its own slice (`uploadQueueSlice`, `slideEditSlice`, `researchChatSlice`, `analyticsSlice`)

4. **Iframe Communication** - Slide editing uses postMessage for parent-iframe communication to isolate slide styles

5. **Streaming Data Handling** - Deep research and AI features use real-time streaming with Socket.io-client

### File Organization
```
src/
├── app/           # Next.js App Router pages and layouts
├── components/    # React components (ui/, tools/, presentation/)
├── hooks/         # Custom React hooks
├── redux/         # Redux store, slices, and RTK Query APIs
├── services/      # API communication and business logic
├── lib/           # Utility libraries (presentation/editing/)
├── types/         # TypeScript type definitions
├── adapters/      # Data transformation adapters
└── config/        # Configuration constants and routes
```

### Authentication
- JWT token-based authentication stored in cookies
- Google OAuth integration via `@react-oauth/google`
- Middleware protects `/dashboard/*` routes, redirects unauthenticated users to `/auth/login`

### Error Handling Strategy
- Error boundaries for component isolation (especially in slide editing)
- Custom error classes with user-friendly messages (e.g., `UploadError`)
- Toast notifications via centralized toast service

## External Dependencies

### Backend API
- Primary API: `process.env.NEXT_PUBLIC_API_URL` (currently `api-qa.shothik.ai`)
- Endpoints for plagiarism detection, paraphrasing, AI detection, marketing automation, research

### Third-Party Services
- **Meta/Facebook Business API** - OAuth integration for ad publishing, page management, pixel tracking
- **Stripe** - Payment processing via `@stripe/stripe-js`
- **Cloudinary** - Image hosting (configured in next.config.ts)
- **ImageKit** - CDN for media assets (authentication via `getImageKitAuth`)
- **Google Vertex AI Search** - Used by backend for deep research grounding

### Real-time Communication
- **Socket.io-client** - Real-time updates for research streaming, wallet updates

### Analytics
- Google Analytics (gtag)
- Facebook Pixel
- Custom analytics slice with consent management