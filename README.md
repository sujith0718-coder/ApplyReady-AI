# ApplyReady AI

### From Opportunity Found to Application Ready.

**ApplyReady AI** is an evidence-backed opportunity readiness platform that helps students turn messy hackathon, internship, scholarship, and other application notices into clear, trustworthy preparation workflows.

Instead of forcing students to manually search through long notices for deadlines, requirements, documents, and next steps, ApplyReady extracts what is **actually stated**, connects requirements with supporting evidence, and shows what is ready, missing, or still needs attention.

> **No requirement should be invented just to make a user feel ready.**

---

## 🚀 Why ApplyReady?

Application opportunities are often buried inside long PDFs, images, webpages, and unstructured announcements.

Students frequently have to answer:

- What exactly is required?
- What is the deadline?
- Which documents do I need?
- What have I already completed?
- What evidence do I have?
- Am I actually ready to apply?
- What should I do next?

ApplyReady AI brings these answers into one workspace.

### The core workflow

```text
Opportunity
     ↓
Text / PDF / Image / URL
     ↓
Conservative Extraction
     ↓
Requirements + Deadline
     ↓
Evidence Vault
     ↓
Requirement Verification
     ↓
Readiness Report
     ↓
Application Ready
```

---

## ✨ Core Features

### 📥 Multi-Source Opportunity Import

Create opportunities from:

- Pasted text
- PDF documents
- Images using OCR
- Public URLs

The system extracts readable content on the server before processing it.

---

### 🧠 Conservative Requirement Extraction

ApplyReady is designed to prioritize **trust over impressive-looking output**.

If an opportunity does not explicitly contain a requirement, the system should not invent one.

For example:

```text
Input:
ABCD
```

Result:

```text
No requirements matched
```

rather than fabricated requirements, deadlines, resumes, or actions.

---

### 📅 Deadline Detection

ApplyReady detects explicit deadlines from opportunity content when they are present.

If a deadline cannot be reliably detected, it remains:

```text
Not detected
```

instead of displaying an invented date.

---

### 📂 Evidence Vault

Store supporting documents and files related to an opportunity.

Evidence can be used to support application requirements and maintain a clear record of what the user has available.

---

### 🔐 Evidence-Based Completion

ApplyReady protects against false completion.

A requirement cannot simply be marked complete without appropriate verified evidence.

The server enforces this rule rather than relying only on frontend behavior.

This creates a stronger trust boundary between:

**“I clicked complete”**

and

**“I actually have evidence that supports this requirement.”**

---

### 📊 Readiness Report

The readiness workspace brings together:

- Detected requirements
- Requirement status
- Evidence
- Missing items
- Application readiness
- Relevant context
- Next actions

The goal is not just to extract information, but to help answer:

> **“Am I actually ready to submit?”**

---

### 🛡️ No-Hallucination-Oriented Design

ApplyReady intentionally avoids generating fake information when source evidence is unavailable.

For irrelevant or insufficient input, it can return states such as:

- `Not detected`
- `No requirements matched`
- `No readable text detected`
- `Unknown`

This is especially important for application workflows where a fabricated deadline or requirement can cause a real missed opportunity.

---

## 🏗️ Architecture

ApplyReady uses a lightweight full-stack architecture designed to keep extraction and application state understandable.

```text
                    ┌─────────────────────┐
                    │      React + Vite    │
                    │      Web Client      │
                    └──────────┬──────────┘
                               │
                               │ REST API
                               ▼
                    ┌─────────────────────┐
                    │   Express + Node.js │
                    │     API Server      │
                    └──────────┬──────────┘
                               │
             ┌─────────────────┼─────────────────┐
             │                 │                 │
             ▼                 ▼                 ▼
         PDF Parser          OCR            URL Parsing
         pdf-parse         Tesseract.js        Cheerio
             │                 │                 │
             └─────────────────┼─────────────────┘
                               ▼
                    Conservative Extraction
                               │
                               ▼
                    Requirements / Deadline
                               │
                               ▼
                         MongoDB
                       + Mongoose
```

### Technology Stack

**Frontend**

- React
- TypeScript
- Vite
- CSS

**Backend**

- Node.js
- Express
- TypeScript

**Database**

- MongoDB
- Mongoose

**Document Intelligence**

- PDF text extraction
- Tesseract.js OCR
- Cheerio-based webpage extraction

**Engineering**

- REST APIs
- Server-side validation
- Explainable extraction
- Evidence verification
- Demo/in-memory fallback

---

## 📁 Project Structure

```text
ApplyReady-AI/
├── apps/
│   ├── api/
│   │   └── src/
│   │       ├── models/
│   │       ├── domain.ts
│   │       ├── server.ts
│   │       └── external.d.ts
│   │
│   └── web/
│       └── src/
│           ├── components/
│           ├── pages/
│           ├── lib/
│           ├── App.tsx
│           └── styles.css
│
├── package.json
└── README.md
```

---

## 🔌 API Capabilities

The API provides health, opportunity, extraction, document, requirement, and profile-related functionality.

Representative endpoints include:

| Method | Endpoint                                         | Purpose                               |
| ------ | ------------------------------------------------ | ------------------------------------- |
| GET    | `/api/v1/health`                                 | API health check                      |
| POST   | `/api/v1/opportunities`                          | Create opportunity from text          |
| POST   | `/api/v1/opportunities/from-file`                | Create opportunity from PDF/image     |
| POST   | `/api/v1/opportunities/from-url`                 | Import opportunity from public URL    |
| POST   | `/api/v1/opportunities/:id/documents`            | Upload supporting evidence            |
| PATCH  | `/api/v1/documents/:id`                          | Update document metadata/verification |
| PATCH  | `/api/v1/opportunities/:id/requirements/:reqKey` | Update requirement status             |

> Endpoint availability can evolve with the application; the source code is the authoritative API definition.

---

## 🔍 Trust & Explainability

ApplyReady follows a conservative extraction philosophy:

### Source → Extraction → Decision

The system does not intentionally jump from:

```text
"Maybe this is required"
```

to:

```text
"This is definitely required"
```

Instead, extracted information is tied to the available source content and confidence where applicable.

This helps users distinguish between:

- What the opportunity explicitly says
- What was successfully detected
- What could not be detected
- What still requires user verification

---

## 🧪 Reliability & Safety Principles

ApplyReady is built around several important principles:

- **Do not invent missing deadlines**
- **Do not fabricate requirements**
- **Do not create fake readiness**
- **Do not mark evidence-backed tasks complete without verification**
- **Keep extraction explainable**
- **Fail clearly when source content cannot be read**
- **Preserve existing workflows when adding new capabilities**

For example, an inaccessible webpage should produce a clear fetch/extraction error rather than fabricated opportunity information.

---

## 🤖 Built with OpenAI Codex

ApplyReady was developed with **OpenAI Codex as an engineering agent**, not merely as an autocomplete tool.

Codex was used throughout the development workflow for:

- Repository inspection
- Feature planning
- Frontend and backend implementation
- Multi-file changes
- Debugging
- TypeScript error resolution
- Build verification
- Runtime troubleshooting
- Refactoring and stabilization
- Reviewing implementation safety
- Iterative testing

The development process emphasized:

```text
Inspect
  ↓
Plan
  ↓
Implement
  ↓
Run
  ↓
Test
  ↓
Review
  ↓
Fix
  ↓
Verify
```

This agentic workflow helped evolve ApplyReady from an initial application concept into a functional full-stack product while preserving the existing architecture.

---

## 🎯 Hackathon Track

### Domain Agents

ApplyReady applies AI-assisted intelligence to a specific real-world workflow:

> **Helping students understand and prepare for application opportunities.**

It combines document understanding, requirement extraction, evidence management, and readiness analysis into a single workflow.

---

## 🌍 Impact

ApplyReady is designed primarily for students who encounter opportunities through:

- Hackathons
- Internships
- Scholarships
- Competitions
- Fellowships
- Academic programs
- Other application-based opportunities

The objective is simple:

> **Reduce the gap between finding an opportunity and being genuinely ready to apply.**

---

## 🛣️ Future Roadmap

Potential future improvements include:

- More advanced document understanding
- Better requirement-to-evidence matching
- Confidence-aware extraction UI
- Rich document previews
- Improved webpage extraction
- Natural-language application planning
- More intelligent next-best-action recommendations
- Automated evaluation and regression tests
- Background processing for large OCR workloads
- Secure authenticated document storage

These are intentionally separated from the current core so the existing stable workflow remains reliable.

---

## 🛠️ Run Locally

### Prerequisites

- Node.js
- npm
- MongoDB (optional when using the application's demo/in-memory fallback)

### Install

```bash
npm install
```

### Start development

```bash
npm run dev
```

The web application runs through the Vite development server.

The API runs through the Express development server.

---

## 🧪 Verification

Before submission, the application should be verified through the core end-to-end flow:

```text
Import Opportunity
        ↓
Extract Information
        ↓
Review Requirements
        ↓
Add Evidence
        ↓
Verify Evidence
        ↓
Review Readiness
        ↓
Take Action
```

Additional negative-path verification:

```text
Invalid / irrelevant text
        ↓
No fabricated requirements
        ↓
No fabricated deadline
        ↓
No fabricated readiness
```

---

## 📌 Project Status

**Functional MVP — Hackathon Build**

ApplyReady AI currently focuses on one principle:

> **Make application readiness clearer without pretending to know what the source doesn't say.**

---

## 👨‍💻 Built for the ChatGPT Codex Hackathon 2026

Built independently as a full-stack AI product using OpenAI Codex as an agentic engineering partner.

**Track:** Domain Agents
**Project:** ApplyReady AI
**Focus:** Trustworthy opportunity understanding and application readiness

---

### From opportunity found → to application ready.
