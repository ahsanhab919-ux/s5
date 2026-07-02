# Marketing Automation System - Complete Overview

**Last Updated:** 2025-11-22  
**Project:** Shothik-v3

## System Architecture

The marketing automation system is a comprehensive end-to-end AI-powered platform for creating, managing, and publishing Meta (Facebook/Instagram) advertising campaigns.

---

## Core Service Layer

### File: `src/services/marketing-automation.service.ts`

#### Campaign API (`campaignAPI`)
- **getInitialSuggestions**: Generate AI campaign suggestions based on product analysis
- **chat**: Conversational AI interface with memory for campaign refinement
- **getChatHistory** / **clearChatHistory**: Manage conversation history
- **saveCampaignData** / **getCampaignData**: Persist campaign structures (campaigns, ad sets, ads, personas)
- **generateAd**: Create ad copy based on product, persona, awareness stage, format, and angle
- **improveAd**: AI-powered ad improvement based on feedback
- **publishAds**: Deploy ads to Meta platforms with targeting configurations

#### Media API (`mediaAPI`)
- **generateMedia**: AI image/video generation for specific ads
- **generateMediaBatch**: Bulk media generation for multiple ads
- **regenerateMedia**: Custom prompt-based regeneration with region selection
- **saveUploadedMedia**: Upload and associate media with ads
- **getImageKitAuth**: Authentication for ImageKit CDN integration
- **searchCities** / **getCommonCities**: Geo-targeting for Bangladesh and other countries

#### Meta/Facebook API (`metaAPI`)
- **initiateAuth**: OAuth flow for Facebook Business integration
- **getUserData**: Fetch connected pages, business accounts, and ad accounts
- **updateSelections**: Save user's account preferences
- **getPixels**: Retrieve Meta pixels for conversion tracking
- **getWebhookStatus** / **subscribeWebhook** / **unsubscribeWebhook**: Messenger integration
- **disconnect**: Remove Facebook account connection

---

## Main Application Pages

### 1. URL Analysis Page
**File:** `src/app/(primary-layout)/marketing-automation/page.tsx`  
**Component:** `URLAnalysis.tsx`

#### Features
- Product URL analysis with streaming AI
- Real-time progress updates with step-by-step status
- Web search integration for market research
- Project management (create, view, delete)
- Meta/Facebook account connection interface

#### User Flow
1. Enter product/service URL
2. AI streams analysis steps (scraping → product analysis → market research → competitor analysis)
3. Displays search queries performed
4. Saves analysis to database
5. Shows analysis results with option to create campaign

---

### 2. Campaign Canvas
**File:** `src/components/(primary-layout)/(marketing-automation-page)/Canvas.tsx`

#### Layout
- **Split View Design**:
  - Left (Desktop) / Sheet (Mobile): AI Chat Assistant
  - Right: Campaign visualization cards

#### Features
- **Dual Data Sources**:
  - Fresh AI suggestions for new projects
  - Reconstructed data from saved campaigns
- **Welcome Message**: AI introduces campaign strategy with:
  - Campaign name and objective
  - Budget recommendations (daily min/max)
  - Persona count
  - Ad concept count
  - Strategy notes
- **Real-time Sync**: Chat modifications update canvas immediately
- **Mobile Optimization**: Floating chat button with message count badge

---

### 3. AI Insights
**File:** `src/components/(primary-layout)/(marketing-automation-page)/AIInsights.tsx`

#### Features
- **Conversational Interface**: Ask questions about campaigns, audiences, performance
- **Mind Map Generation**: Visual campaign structure representation
- **Mind Map History**: Browse and reopen previous visualizations
- **Data Source Indicators**:
  - `meta_api`: Live Facebook data
  - `campaign`: Stored campaign data
  - `project`: Product analysis data
  - `mixed`: Combination of sources
- **Markdown Support**: Rich formatting for AI responses

---

### 4. Facebook Account Selection
**File:** `src/components/(primary-layout)/(marketing-automation-page)/FacebookAccountSelectionScreen.tsx`

#### Selection Process
1. **Facebook Pages**: Multi-select pages for ad publishing
2. **Business Account**: Choose business manager
3. **Ad Account**: Select account for billing and management
4. **Meta Pixels** (Optional): Choose tracking pixel for conversions

#### CTA Configuration
- Auto-detects unique CTAs from selected ads
- **Smart URL Assignment**:
  - `SHOP_NOW`: Full product URL
  - Other CTAs: Base domain URL
- **Editable**: Manual override for each CTA type
- Displays ad count per CTA

#### Publishing
- Updates Meta account selections
- Publishes ads with targeting, media, and CTA URLs
- Shows success/failure feedback

---

### 5. AI Media Studio
**File:** `src/components/(primary-layout)/(marketing-automation-page)/AIMedia.tsx`

#### Sections (Tabs)
- **Avatars**: AI avatar creation tools
- **Smart Assets**: Reusable media library
- **Medias**: Generated and uploaded media management
- **AI Shorts**: Short-form video generation
- **UGC Video**: User-generated content style videos

#### Features
- **URL State Management**: Active section persisted in query params
- **Mobile Tabs**: Horizontal scrollable navigation
- **Desktop Sidebar**: Vertical navigation with icons
- **Tool Navigation**: Click handlers for sub-tools

---

## Key AI Features

### Campaign Generation Strategy
Follows **Meta's 2025 Andromeda Strategy**:
- Full-funnel approach (Top, Middle, Bottom of funnel)
- Buyer persona development
- Awareness stage targeting
- Multiple ad concepts per persona/stage

### Campaign Data Structure
```typescript
{
  campaigns: [{
    name: string,
    objective: string,
    budget: number,
    strategy_notes: string[]
  }],
  adSets: [{
    name: string,
    targeting: {...},
    budget: number
  }],
  ads: [{
    headline: string,
    primary_text: string,
    description: string,
    cta: string,
    media: {...}
  }],
  personas: [{
    name: string,
    demographics: {...},
    interests: [...],
    pain_points: [...]
  }]
}
```

---

## Technical Stack

### Frontend
- **Framework**: Next.js (App Router)
- **State Management**: Redux, React Query
- **UI Components**: Shadcn/ui, Radix UI
- **Styling**: Tailwind CSS
- **Markdown**: react-markdown with remark-gfm

### Backend Integration
- **API Communication**: Axios-based API client
- **Authentication**: JWT tokens in localStorage
- **Streaming**: Server-Sent Events for real-time analysis
- **File Upload**: ImageKit CDN integration

### Meta Integration
- **OAuth**: Facebook Login for Business
- **APIs**: Graph API for Pages, Business Manager, Ads Manager
- **Webhooks**: Messenger platform integration
- **Pixels**: Conversion tracking setup

---

## User Journey

### Complete Flow
1. **Analyze** → Enter product URL → AI analyzes product, market, competitors
2. **Generate** → AI creates campaign structure with personas and ad concepts
3. **Refine** → Chat with AI to modify campaigns, personas, or ads
4. **Create Media** → Generate or upload images/videos for ads
5. **Connect Meta** → Authenticate Facebook Business account
6. **Configure** → Select pages, business account, ad account, pixels
7. **Publish** → Deploy ads to Facebook/Instagram with targeting

---

## Mobile Responsiveness

### Adaptive Layouts
- **Desktop**: Side-by-side chat and content
- **Mobile**: 
  - Full-screen content
  - Floating action buttons for chat/sidebar
  - Bottom sheets for secondary panels
  - Horizontal scrollable tabs

### Breakpoint: `md` (768px)
- Below: Mobile UI with sheets
- Above: Desktop UI with split views

---

## State Management

### React Query Caches
- `projects`: Project list
- Meta user data
- Campaign data
- Chat history

### Local State
- Active selections (pages, accounts, pixels)
- Chat messages
- UI states (loading, errors, modals)
- Sidebar/tab selections

---

## Error Handling

### User Feedback
- Toast notifications for operations
- Inline error messages
- Loading states with spinners
- Empty states with action prompts

### Graceful Degradation
- Works without Meta connection (limited features)
- Falls back to stored data when API fails
- Reconstructs suggestions from saved campaigns

---

## Performance Optimizations

- **Code Splitting**: Route-based lazy loading
- **Memoization**: useMemo, useCallback for expensive computations
- **Query Caching**: React Query automatic caching
- **Optimistic Updates**: UI updates before API confirmation
- **Image Optimization**: CDN with ImageKit

---

## Future Considerations

### Potential Enhancements
- A/B testing interface
- Performance analytics dashboard
- Automated campaign optimization
- Multi-platform support (beyond Meta)
- Template library for campaigns
- Team collaboration features
- Campaign scheduling

---

## File Structure

```
src/
├── app/(primary-layout)/marketing-automation/
│   ├── page.tsx (URL Analysis entry)
│   ├── canvas/[projectId]/
│   ├── insights/[analysisId]/
│   └── media/[projectId]/
├── components/(primary-layout)/(marketing-automation-page)/
│   ├── URLAnalysis.tsx
│   ├── Canvas.tsx
│   ├── AIInsights.tsx
│   ├── FacebookAccountSelectionScreen.tsx
│   ├── AIMedia.tsx
│   ├── Dashboard/
│   ├── Knowledge/
│   └── canvas/, media/, URLAnalysis/ (subcomponents)
├── services/
│   └── marketing-automation.service.ts
├── hooks/(marketing-automation-page)/
│   ├── useCampaignsApi.ts
│   ├── useProjectsApi.ts
│   └── useMetaData.ts
└── types/
    ├── analysis.ts
    └── campaign.ts
```

---

## Notes

- System is production-ready with comprehensive error handling
- Follows Next.js 13+ App Router conventions
- Responsive design tested on mobile and desktop
- Meta integration requires Business Manager permissions
- AI features powered by backend LangGraph agents
