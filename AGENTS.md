# Other coding agents

Follow the shared engineering instructions in [CLAUDE.md](CLAUDE.md). The same branch, sprint, human approval, scope, security and verification rules apply to every coding assistant, including Codex. In particular: write tests with every behavior change per [docs/TESTING.md](docs/TESTING.md) and run only affected tests while iterating (`node scripts/harness.mjs test`), and end every run with the review guide described in CLAUDE.md. Do not act as an orchestrator for other members' independent local sessions.
