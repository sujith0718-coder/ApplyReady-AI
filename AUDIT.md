# ApplyReady AI product audit

Audit date: 28 July 2026

## Working features

- Express API starts with structured, validated demo and extraction endpoints.
- Deterministic requirement extraction avoids invented facts and supplies confidence/source text.
- Readiness scoring, critical deadline risk, blocker chain, and CGPA conflict examples are implemented in the domain layer.
- Dashboard loads a demo report and both resolution actions update its server-held state.
- Production build and compiled domain tests pass.

## Partial features

| Area | Current state | Gap | Priority / effort |
|---|---|---|---|
| Opportunity upload | Text extraction endpoint exists | No screen, notice input, or saved result | P0 / medium |
| Dashboard | Good initial overview | Static title/date, no timeline/activity, only partial navigation | P0 / medium |
| Requirements | Preview cards only | No page, filtering, source/evidence/action detail | P0 / medium |
| Evidence vault | Preview cards only | No upload simulation, search/filter/preview | P0 / medium |
| Readiness report | Dashboard section only | No standalone report or category breakdown | P0 / medium |
| Profile | Sidebar identity only | No editable profile or completion meter | P1 / small |
| Settings | Sidebar link only | No settings state or API status | P1 / small |
| AI integration | Deliberate mock mode | OpenAI provider/Mongo persistence are documented but not implemented | P2 / large |

## Missing / deceptive UI identified

- Sidebar items changed an active label but did not render corresponding pages.
- **Manage**, **Add supporting evidence**, and **View all** appeared interactive but did not complete a user task.
- Reset button only reloaded current server state; it did not invoke the reset endpoint.
- No landing page, routing, empty/error states, upload experience, or downloadable report existed.
- No report-level filtering, sorting, search, or visible evidence mapping existed.

## Runtime / code findings

- The dashboard fetch only handled the happy path; network/API failures were rendered as an indefinite loading state.
- Frontend logic was compressed into one component, impeding reuse and page completion.
- `tsx --test` fails in this Windows sandbox because `os.userInfo()` returns an environment-level `ENOMEM`; tests pass when executed from compiled JavaScript with `node --test dist/domain.test.js`.
- No TODO/FIXME markers or dead API routes were found.

## Implementation order

1. Replace inactive navigation and buttons with genuine routed page states and error/loading handling.
2. Implement opportunity intake/extraction and document action flows against the existing API.
3. Add complete Requirements, Vault, Report, Profile, and Settings experiences.
4. Strengthen dashboard with timeline/activity, graph preview, countdown, and real reset.
5. Verify all flows, build, typecheck, API calls, and the compiled test suite.
