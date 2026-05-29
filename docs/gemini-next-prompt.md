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

You must follow the priority order below exactly. Do not skip ahead. Do not invent new scope.

Priority 1. Expand benchmark evidence safely
- Treat `benchmark/proposed_agent_jobs.csv.bak` and `benchmark/proposed_agent_results.csv.bak` as raw T004-T005 expansion evidence only.
- Do not overwrite `benchmark/proposed_agent_jobs.csv` or `benchmark/proposed_agent_results.csv`.
- If a future expansion is attempted, keep T001-T003 controlled comparison data separate from any T004+ data.
- Record any expansion decision in `docs/progress.md` and `CHANGELOG.md`.

Priority 2. Restore and preserve benchmark reproducibility
- Verify that benchmark comparisons remain script-driven and reproducible.
- Keep gold labels, accepted exceptions, duplicate DOI handling, and partial verification statuses encoded in files and scripts, not memory.
- If you touch benchmark outputs, rerun the required benchmark commands and document the exact results.

Priority 3. Keep claims strictly bounded
- Audit `docs/final-submission-story.md`, `paper/final-paper-draft.tex`, and `presentation/*` for any overclaim.
- Forbidden wording or claims: `outperform`, universal superiority, `fully implemented` for optional paths, completed 20-task Proposed Agent runtime evaluation, and any statement implying AI/Vectorize or LLM Critic is production-default.
- If a claim is not directly supported by repository artifacts, label it as planned, opt-in, partial, or pending.

Priority 4. Preserve the final-deliverable narrative
- Update `paper/final-paper-draft.tex` conservatively for grammar, clarity, and traceability.
- Update `presentation/final-presentation-outline.md` and `presentation/final-presentation-mcp.md` only to align with the paper narrative.
- Keep the order: Problem -> Agent structure -> Implementation -> Benchmark -> Limitations -> Demo.
- Keep the paper source in LaTeX form and the presentation source in Markdown/PPTX-generator form; do not invent a new authoring format.

Priority 5. Generate the final deliverables
- Produce or refresh the paper through the LaTeX path using `paper/final-paper-draft.tex` and the verified LaTeX MCP / `pdflatex` flow documented in `docs/mcp-latex-ppt-setup.md`.
- Produce or refresh the presentation through the PPTX path using `presentation/final-presentation-mcp.md` and the verified PPTX generator path documented in `docs/mcp-latex-ppt-setup.md`.
- If a verified MCP is unavailable in the current environment, keep the repository-native sources authoritative and record the exact blocker instead of improvising another format.
- Create or refine `docs/final-demo-script.md` if it is missing or stale.
- Include: dashboard start route, search execution, 12-stage trace check, Ranked Papers check, Paper Detail check, PDF/XLSX download check, Ops diagnostics check, Evaluation dashboard check, fallback completed job path.

Priority 6. Harden handoff records
- Update `docs/gemini-session-state.md` and `docs/progress.md` after every meaningful step.
- Add exact verification commands and exact reasons for anything not executed.
- Never erase prior handoff context.

Priority 7. Record every meaningful change
- Update `CHANGELOG.md` in the same change set.
- Use `(gemini)` attribution for Gemini-authored entries.
- Include affected paths when practical.

Priority 8. Run required verification
- `git diff --check`
- `npm run validate:history`
- `npm run validate:agent-rules`
- `npm run benchmark:audit-gold`
- When benchmark outputs are touched, also run:
  - `npm run benchmark:evaluate-proposed`
  - `npm run benchmark:compare-baselines`
- When regenerating the paper or slides, record the exact LaTeX/PPTX command or MCP path used and whether the artifact was regenerated successfully.

Priority 9. Keep the scope narrow
- Do not edit Worker source, dashboard source, Cloudflare config, D1/R2 config, MCP server code, deployment files, or benchmark CSV/JSON files unless the maintainer explicitly changes the assignment.
- Do not create new product features in this session.
- Do not push without explicit confirmation from the maintainer if the current instruction set requires confirmation.

Priority 10. End-state expectation
- When done, summarize changed files, verification results, remaining risks, and the exact next action needed.
- If you find a conflict between this prompt and a newer direct user request, stop and follow the newer request.
```

## Maintainer Notes

- This task is documentation-only.
- The goal is claim safety, benchmark reproducibility, and final submission clarity, not new functionality.
- Any stronger performance claim must be backed by current tracked benchmark outputs.
