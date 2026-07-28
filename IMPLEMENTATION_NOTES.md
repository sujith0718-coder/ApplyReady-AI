# Implementation notes

The MVP makes readiness deterministic: only verified profile/evidence matches complete a requirement. Critical incomplete requirements reduce readiness more than low-priority items. A profile/resume CGPA that disagrees with an official transcript becomes **needs review** rather than being resolved automatically.

Current limitation: binary file text extraction and MongoDB persistence are represented by interfaces/environment configuration; the demo stores data in memory so it is immediately runnable. Production should add malware scanning, object storage, authenticated users, and an OpenAI Responses API structured-output provider.
