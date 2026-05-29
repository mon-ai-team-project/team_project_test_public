# Gemini Optimized Action Prompt (2026-05-29)

(gemini)

## Overview
This is a condensed, execution-focused version of the instructions for completing the final evaluation packaging. Use this for maximum efficiency in Default mode.

## 1. Safety Checklist
- [ ] **NO GIT PUSH**. Only local commits and file edits are allowed.
- [ ] **SURGICAL EDITING**. Use `replace` whenever possible.
- [ ] **ZERO DELETION**. Never delete or overwrite historical logs in `CHANGELOG.md` or `docs/progress.md`. Prepend new entries.
- [ ] **SCOPE LIMIT**. Do NOT edit Worker, Dashboard, Cloudflare, D1/R2, or benchmark CSV data.

## 2. Deliverable Generation
- [ ] **LaTeX Paper**: `pdflatex -interaction=nonstopmode paper/final-paper-draft.tex`
- [ ] **PPTX Presentation**: Use `node scripts/mcp/pptx-standalone.js presentation/final-presentation-mcp.md presentation/generated/paper-agent-final-presentation.pptx`

## 3. Claim Validation
- [ ] **Evidence-Only**: Every claim in the paper/slides must match `benchmark/proposed_agent_metrics_summary.json` or `benchmark/baseline_comparison_summary.json`.
- [ ] **Top-Journal Precision**: Emphasize **100% Top-Journal Prec.** and **100% DOI Presence** on the T001-T003 sample.
- [ ] **Traceability**: Focus on the "White-box" evidence (D1 traces) as the primary differentiator.

## 4. Benchmark Expansion
- [ ] **Isolation**: Use `npm run benchmark:run-expanded` to collect T004+ data without overwriting tracked files.
- [ ] **Raw Candidate Status**: Treat T004+ data as raw expansion candidates, not final benchmark layers until verified.

## 5. Documentation Hand-off
- [ ] **CHANGELOG.md**: Prepend a summary of local deliverable generation and script additions.
- [ ] **docs/progress.md**: Update hand-off state, noting successful PDF generation and standalone PPTX script.
- [ ] **docs/gemini-session-state.md**: Record current local branch state and next recommended local actions.

---
**Status**: Ready for Execution. (gemini)
