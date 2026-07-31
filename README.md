## 🧑‍💻 Built With OpenAI Codex — Human + Agent Engineering Workflow

ApplyReady AI was developed using **OpenAI Codex as an engineering agent**. My role was to define the product direction, decide what the MVP should solve, make architecture and UX decisions, test the system, evaluate failures, and make final implementation decisions. Codex was used to accelerate the actual engineering work across the repository.

### My role

I was responsible for:

- Defining the problem and target user workflow
- Choosing the MVP scope and prioritizing features
- Designing the application/readiness concept
- Making architecture and implementation decisions
- Reviewing generated changes and deciding what to keep
- Running the application locally and validating behavior
- Testing edge cases and failure states
- Diagnosing whether a problem was product, code, environment, or deployment related
- Validating typechecks, production builds and deployed behavior
- Making final decisions about reliability and user experience

### Codex's role

Codex was used for:

- Repository inspection and codebase understanding
- Implementation planning
- Multi-file feature development
- Frontend and backend changes
- Requirement and readiness logic
- Document processing workflows
- API implementation and integration
- TypeScript error resolution
- Runtime debugging
- Refactoring and stabilization
- Build and test iteration
- Deployment troubleshooting

### Development loop

```text
MY PRODUCT DIRECTION
        ↓
CODEX INSPECTS THE REPOSITORY
        ↓
PLAN
        ↓
IMPLEMENT
        ↓
I RUN THE APPLICATION
        ↓
TEST / TYPECHECK / BUILD
        ↓
REAL FAILURE OR IMPROVEMENT NEEDED
        ↓
CODEX DEBUGS / REFACTORS
        ↓
I REVIEW THE RESULT
        ↓
VERIFY
        ↓
DEPLOY
```

### Why this matters

The project was not developed as a sequence of isolated autocomplete suggestions. Codex was used across the engineering lifecycle: understanding an existing codebase, making coordinated changes across files, investigating failures, implementing fixes, and iterating until the application worked.

At the same time, the product decisions and final validation remained human-controlled. This combination allowed me to move quickly while keeping the system's behavior, scope and reliability under my responsibility.

### Development tools by stage

| Stage              | My responsibility                        | Tool / Codex contribution                                 |
| ------------------ | ---------------------------------------- | --------------------------------------------------------- |
| Problem definition | Define user problem and MVP              | Codex used after requirements were established            |
| Architecture       | Select application structure and stack   | Codex inspected and worked within repository architecture |
| Implementation     | Decide feature behavior                  | Codex implemented multi-file changes                      |
| Local development  | Run and interact with application        | Codex assisted with fixes and iteration                   |
| Validation         | Test functionality and edge cases        | Codex helped diagnose failures and improve implementation |
| Build              | Verify production compilation            | `npm run typecheck`, `npm run build`                      |
| Debugging          | Identify actual failure and decide fix   | Codex investigated and implemented fixes                  |
| Deployment         | Configure and validate production        | Vercel + Codex-assisted troubleshooting                   |
| Final review       | Decide what is acceptable for submission | Human review and validation                               |

### Evidence of Codex usage

The project submission includes evidence from the actual Codex development workflow where available, including implementation tasks, debugging iterations, repository changes and validation steps.

**Principle:** Codex accelerated engineering; I remained responsible for the product.
