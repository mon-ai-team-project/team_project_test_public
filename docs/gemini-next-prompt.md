# Gemini Next Prompt

Updated: 2026-05-29 (codex)

Use this prompt for the next Gemini session. Gemini must read `GEMINI.md`, `AGENTS.md`, and `docs/gemini-session-state.md` before acting.

## Copy-Paste Prompt For Gemini

```text
You are continuing the MON AI Team Paper Agent project from the personal repository baseline.

Start by running:

git status --short --branch
git log --oneline -8

Then read these files before editing:

AGENTS.md
GEMINI.md
docs/agent-writing-rules.md
docs/progress.md
docs/gemini-session-state.md
docs/gemini-next-prompt.md
CHANGELOG.md

Your task is final submission polishing only. Do not implement product features.

1. Final paper polish
   Read `paper/final-paper-draft.tex` and conservatively improve grammar, clarity, and flow.
   Remove or soften any overclaim.
   Forbidden wording or claims: `outperform`, universal superiority, `fully implemented` for optional paths, completed 20-task Proposed Agent runtime evaluation, and any statement implying AI/Vectorize or LLM Critic is production-default.

2. Presentation flow alignment
   Read `presentation/final-presentation-outline.md` and `presentation/final-presentation-mcp.md`.
   Align both with the paper narrative in this order:
   Problem -> Agent structure -> Implementation -> Benchmark -> Limitations -> Demo.
   Do not add or mention any time-limit requirement.

3. Demo script creation
   Create `docs/final-demo-script.md`.
   Include:
   - dashboard start route
   - search execution
   - 12-stage trace check
   - Ranked Papers check
   - Paper Detail check
   - PDF/XLSX download check
   - Ops diagnostics check
   - Evaluation dashboard check
   - fallback completed job path if provider quota or network latency occurs

4. Final claim audit
   Audit `docs/final-submission-story.md`, `paper/final-paper-draft.tex`, and `presentation/*`.
   Keep these labels strict:
   - AI/Vectorize: opt-in or planned unless explicitly enabled
   - LLM Critic: opt-in, not default
   - 20-task Proposed Agent runtime: pending
   - Google Drive upload: conditional on OA PDF availability
   - Benchmark claim: T001-T003 controlled evidence only for current comparison

5. Records and verification
   Update `CHANGELOG.md`, `docs/progress.md`, and `docs/gemini-session-state.md` with `(gemini)` attribution.
   Run:

   git diff --check
   npm run validate:history
   npm run benchmark:audit-gold

   If a command is not run, record the exact reason in `docs/gemini-session-state.md`.

Strictly forbidden files and areas:
- Worker source
- dashboard source
- Cloudflare config
- D1/R2 config
- MCP server code
- deployment files
- benchmark CSV/JSON files

Before ending, summarize changed files, verification results, remaining risks, and ask where to push. Do not push without explicit confirmation.
```

## Maintainer Notes

- This task is documentation-only.
- The goal is claim safety and final submission clarity, not new functionality.
- Any stronger performance claim must be backed by current tracked benchmark outputs.
