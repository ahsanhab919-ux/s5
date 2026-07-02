# Shothik AI — v4

> **Making AI Writing Simple & Accessible**
>
> A comprehensive AI ecosystem for content creation, refinement, and business automation — serving users in 150+ countries. Built in Dhaka, Bangladesh 🇧🇩 with a presence in London, UK 🇬🇧.

---

## 🚀 Overview

Shothik AI V4 is a **monorepo full-stack platform** built on **Next.js** (frontend) with **Python/Node.js** microservices (backend). It collapses the fragmented AI toolchain — ChatGPT, Quillbot, Grammarly, Turnitin — into a single, unified interface.

**Tech Stack:**
- **Frontend:** Next.js (React), TypeScript, Tailwind CSS, shadcn/ui
- **Backend:** Python (NLP/Inference), Node.js microservices
- **Infrastructure:** Docker, Google Cloud Build, Playwright (E2E)
- **Package Manager:** pnpm (workspaces)
- **Testing:** Vitest (unit), Playwright (E2E)

---

## 📦 Repository Structure

```
shothik-v4/
├── src/                          # Next.js frontend application
├── backend-services/
│   └── nlp-inference-service/   # Python NLP & paraphrasing microservice
├── public/                       # Static assets
├── e2e/                          # Playwright end-to-end tests
├── docs/                         # Project documentation
├── scripts/                      # Build and utility scripts
├── memorybank/                   # Agent memory / RAG data
├── .github/workflows/            # CI/CD pipelines
├── .husky/                       # Git hooks
├── Dockerfile                    # Container configuration
├── cloudbuild.yaml               # Google Cloud Build config
├── next.config.ts                # Next.js configuration
├── tailwind.config.ts            # Tailwind CSS configuration
└── .env.example                  # Environment variable template
```

---

## 🧩 Platform Pillars

### 1. AI Writing & Content Tools

| Tool | Description |
|---|---|
| **Paraphrase** | Rewrites content in Basic, Formal, or Creative modes |
| **AI Detector** | Checks if text matches AI-generated patterns |
| **Humanize GPT** | Humanizes AI text using the proprietary Panda model |
| **Plagiarism Checker** | Scans for duplicate content across the web |
| **Grammar Fix** | Advanced grammar and spelling correction via NLP service |
| **Summarizer** | Condenses long-form content |
| **Translator** | Translates text across languages |

**Backend Architecture — Two Distinct Services:**

| | Paraphrasing Service | NLP Service |
|---|---|---|
| **Function** | Generative style transfer (Seq2Seq) | Linguistic analysis & correction |
| **Model Type** | Transformer Decoder (e.g., Llama/Mistral) | Encoder (BERT) / Statistical Parser |
| **Compute** | GPU-intensive (high VRAM) | CPU-intensive (low VRAM) |
| **Latency** | 500ms – 2s | < 100ms |
| **Use Case** | On-demand rewriting | Real-time grammar underlines |

---

### 2. Shothik Agents (Automation)

- **AI Slides** — Generates presentation decks automatically
- **AI Sheets** — Automates spreadsheet tasks and data management
- **Deep Research** — In-depth academic or business research agent using RAG + Map-Reduce over scraped sources
- **Browse for Me** *(Coming Soon)* — Headless browser agent (Playwright) for autonomous web navigation

**MCP Integration:** The Paper Debugger agent uses the **Model Context Protocol (MCP)** to live inside the editor, proposing Git-style diff patches that users accept or reject granularly.

---

### 3. Vibe Meta Automation (Business)

End-to-end automation for Meta (Facebook/Instagram) ad campaigns:

- **Strategy** — Analyzes products/services to generate AI-driven ad strategies
- **Execution** — Automates ad creative generation, copy, and campaign launch via Meta Graph API
- **Management** — Continuous campaign optimization

> Claimed time saving: **20+ hours/week** for agencies.

---

## ⚙️ Getting Started

### Prerequisites

- Node.js `>=18`
- pnpm `>=8`
- Python `>=3.10` (for NLP service)
- Docker (optional, for containerized deployment)

### Installation

```bash
# Clone the repository
git clone https://github.com/ahsanhab919-ux/s5.git
cd s5

# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env.local
```

### Development

```bash
# Start the Next.js frontend
pnpm dev

# Run unit tests
pnpm test

# Run E2E tests
pnpm e2e
```

### Docker

```bash
docker build -t shothik-v4 .
docker run -p 3000:3000 shothik-v4
```

---

## 🔑 Environment Variables

Copy `.env.example` to `.env.local` and fill in the required values.

### NLP Inference Service (`/backend-services/nlp-inference-service`)

| Variable | Required | Description |
|---|---|---|
| `ALLOWED_ORIGINS` | ✅ Yes | Comma-separated list of permitted CORS origins |

**Local development:**
```bash
ALLOWED_ORIGINS="http://localhost:3000,http://127.0.0.1:3000"
```

**Production:**
```bash
ALLOWED_ORIGINS="https://your-frontend-domain.com,https://www.your-frontend-domain.com"
```

> ⚠️ If `ALLOWED_ORIGINS` is not set, the API will reject **all** incoming requests.

---

## 💰 Pricing Tiers

| Plan | Target | Key Features |
|---|---|---|
| **Free** | General users | Basic tool access |
| **Starter** | Students | Humanize (Panda model), Grammar Fix |
| **Pro** | Creators & professionals | Full writing suite, AI Agents |
| **Business** | Agencies & marketing teams | Vibe Meta Automation, Deep Research, priority support |

---

## 🌐 Website Structure

- **Top Nav:** About · Contact · Pricing · Blogs
- **Sidebar:** Direct access to all tools (Paraphraser, Detector, Agents, etc.)
- **Design:** Light/dark mode, mobile-responsive, dashboard-first layout
- **Footer:** Legal · Company · Support (Discord, FAQs)

---

## 🛠️ CI/CD

- **GitHub Actions** (`.github/workflows/`) — automated lint, test, and build checks
- **Google Cloud Build** (`cloudbuild.yaml`) — container build and deploy pipeline
- **Husky** — pre-commit hooks to enforce code quality

---

## 📄 License

This project is proprietary. All rights reserved © Shothik AI.

---

## 🤝 Contributing

Internal contributions only. Please refer to `TASKLIST.md` for active development items and `APPLIED-CHANGES.md` for the changelog.
