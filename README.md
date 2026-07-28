# ApplyReady AI

**From Opportunity Found → Application Ready.** ApplyReady turns long application notices into an evidence-backed action plan for students applying to hackathons, internships, and scholarships.

## Architecture

`React + Vite client → /api/v1 REST API → domain services → MongoDB (optional)`

The API uses a provider boundary for opportunity extraction. `MockExtractionProvider` is deterministic and powers the demo without external credentials. `OpenAIExtractionProvider` is an extension point; no API key ever reaches the browser.

## Folder structure

```text
apps/api/src     Express API, domain services, mock AI extraction, tests
apps/web/src     Vite React UI and the interactive demo experience
```

## Milestones

- [x] Domain model, readiness/risk/blocker rules, deterministic extraction
- [x] REST endpoints and demo seed/reset API
- [x] Responsive demo dashboard, evidence and report experiences
- [x] Unit tests for scoring and contradiction behavior
- [ ] Configure MongoDB Atlas and OpenAI for persistent/live production data

## Setup

1. Copy `apps/api/.env.example` to `apps/api/.env` and optionally set MongoDB/OpenAI values.
2. Install dependencies: `npm install`
3. Run: `npm run dev`
4. Open `http://localhost:5173`.

> If no environment variables are present, the app intentionally starts in local deterministic demo mode.

## API overview

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/v1/demo` | Complete seeded opportunity/report payload |
| POST | `/api/v1/demo/reset` | Restore original demo state |
| POST | `/api/v1/demo/resolve` | Add transcript or endorsement and recalculate |
| POST | `/api/v1/opportunities/extract` | Extract normalized requirements from notice text |
| GET | `/api/v1/readiness/:opportunityId` | Get readiness report |

## Demo script

Open the dashboard: the student has a submitted hackathon notice, a resume and ID card, but is missing a transcript and institute endorsement. The product flags both, shows the endorsement approval chain and a CGPA discrepancy. Select **Resolve transcript** or **Start endorsement workflow** to recalculate the score.

## Deployment

Deploy `apps/web` to Vercel with `VITE_API_URL` pointing to the deployed API. Deploy `apps/api` to Render, set `MONGODB_URI`, `OPENAI_API_KEY`, and `CORS_ORIGIN`. MongoDB Atlas is optional for the local demo but recommended for production persistence.
