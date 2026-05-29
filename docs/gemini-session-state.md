# Gemini Session State

Updated: 2026-05-29 (codex strict Gemini priority prompt updated)

## Current Source Of Truth
- `docs/final-submission-story.md`
- `paper/final-paper-draft.tex`
- `presentation/final-presentation-outline.md`
- `presentation/final-presentation-mcp.md`
- `docs/gemini-next-prompt.md`
- `docs/proposed-agent-bak-review-2026-05-29.md`
- `docs/gemini-session-state.md`
- `CHANGELOG.md`
- `docs/progress.md`

## Current Personal Repo State

- Active branch at evaluation time: `task/final-evaluation-packaging`.
- Personal repository default remains `origin/main`; accepted work must be pushed to `origin/main` unless the user explicitly requests otherwise.
- Organization repository integration remains separate and PR-gated through `team-origin`.

## Latest Reviewed State

- Final paper and presentation packaging were previously reviewed and pushed in `57c9270`.
- `docs/gemini-next-prompt.md` was added and pushed in `bc754de` to prevent Gemini from relying on chat memory.
- Gemini's benchmark-backup task was reviewed and pushed in `0973960`; T004-T005 `.bak` files are raw expansion evidence only.
- Gemini's deliverable-refresh task was reviewed by Codex on 2026-05-29. Codex corrected changelog placement, fixed `benchmark:run-expanded` to use `--jobs-output`, softened unsupported demo claims, and verified PDF/PPTX regeneration paths before push.
- Current generated deliverables: `paper/final-paper-draft.pdf` from `pdflatex` and `presentation/generated/paper-agent-final-presentation.pptx` from `scripts/mcp/pptx-standalone.js`.

## Benchmark Backup Finding

- `benchmark/proposed_agent_jobs.csv.bak` contains T004-T005 job rows.
- `benchmark/proposed_agent_results.csv.bak` contains 32 T004-T005 result rows.
- These files should not overwrite `benchmark/proposed_agent_jobs.csv` or `benchmark/proposed_agent_results.csv`, because the tracked benchmark layer is currently the controlled T001-T003 comparison set.
- T004-T005 rows include useful expansion evidence, but some rows have `partial` verification and `Enrichment limit 10 reached; Crossref lookup skipped to stay within Worker subrequest limits.`
- Future integration should use a separate expanded benchmark file or a rerun/cleanup process, not direct replacement of the current benchmark CSVs.

## What Gemini Must Do Next

Gemini must follow `docs/gemini-next-prompt.md` unless the user gives a newer explicit instruction. The current next prompt is intentionally strict and ordered; do not skip ahead or widen scope on your own. Current safe next work remains documentation, benchmark reproducibility, and final-deliverable polishing only. The next prompt now explicitly includes LaTeX report generation and PPTX generation through the verified MCP or documented fallback path.

Priority order:

1. Expand benchmark evidence safely without overwriting controlled T001-T003 CSVs.
2. Preserve benchmark reproducibility and scripted exception handling.
3. Keep all claims strictly bounded to repository-backed evidence.
4. Preserve the final-deliverable narrative in the paper and presentation.
5. Prepare or refine the demo script.
6. Harden handoff records in `docs/gemini-session-state.md` and `docs/progress.md`.
7. Record every meaningful change in `CHANGELOG.md`.
8. Run required verification commands.
9. Keep the scope narrow and avoid forbidden files.
10. End with changed files, verification results, risks, and next action.

Do not edit Worker, dashboard source, Cloudflare config, D1/R2 config, MCP server code, deployment files, or tracked benchmark CSV/JSON files unless the user explicitly reassigns that scope.

## Gemini Constraints

- Do not modify Worker, Cloudflare, deployment, or dashboard files.
- Do not overwrite the tracked T001-T003 benchmark CSVs with T004-T005 `.bak` data.
- Ensure `(gemini)` attribution is used for Gemini-authored entries.
- Do not erase prior history or compress source-of-truth files in a way that removes operational context.

## Required Verification Baseline

```bash
git diff --check
npm run validate:history
npm run validate:agent-rules
npm run benchmark:audit-gold
```

Additional benchmark checks when benchmark outputs are touched:

```bash
npm run benchmark:evaluate-proposed
npm run benchmark:compare-baselines
```
