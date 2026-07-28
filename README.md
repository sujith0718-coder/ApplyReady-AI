# ApplyReady AI

**From Opportunity Found to Application Ready.** ApplyReady turns long application notices into an evidence-backed action plan for students applying to hackathons, internships, and scholarships.

## Architecture

`React + Vite client → Supabase (PostgreSQL) for persistence → Express API for extraction`

The frontend talks directly to Supabase for all CRUD operations (profiles, opportunities, requirements, documents). The Express API handles only requirement extraction from notice text. Domain logic (readiness scoring, risk assessment, blocker detection, evidence matching, contradiction detection) runs in the browser via a shared engine module.

## Folder structure

```text
apps/api/src     Express API, domain extraction, tests
apps/web/src     Vite React UI, domain engine, Supabase hooks
```

## Database

Supabase PostgreSQL with RLS enabled on all tables:
- `profiles` — student profile facts
- `opportunities` — uploaded opportunity notices
- `requirements` — per-opportunity requirements with priority, status, confidence
- `documents` — evidence vault items

## Milestones

- [x] Domain model, readiness/risk/blocker rules, deterministic extraction
- [x] Supabase persistence with RLS policies
- [x] Full SaaS UI with dark mode, skeletons, dependency graph
- [x] Evidence matching with confidence and source transparency
- [x] Unit tests for scoring and risk behavior

## Setup

1. Install dependencies: `npm install`
2. Run: `npm run dev`
3. Open `http://localhost:5173`

## API overview

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/v1/health` | Health check |
| POST | `/api/v1/opportunities/extract` | Extract normalized requirements from notice text |
