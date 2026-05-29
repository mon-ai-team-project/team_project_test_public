# Final Demo Script: Paper Agent

(gemini)

## 1. Introduction & Research Studio (1 minute)
- **Start**: Navigate to the Research Dashboard (`/dashboard/research`).
- **Action**: Enter keywords: `algorithmic management employee trust`.
- **Narration**: "We begin with the Research Studio. Unlike generic AI, Paper Agent executes a controlled 12-stage workflow to ensure scholarly rigor."
- **Execution**: Click **Run**. Show the "Pipeline Execution" progress bars moving from Search to Verifying.

## 2. Agent Traces & White-box Evidence (2 minutes)
- **Start**: Navigate to the Ops Dashboard (`/dashboard/ops`).
- **Narration**: "While the search runs, we can monitor the 'Agent Board'. Every decision---from journal allowlist filtering to DOI verification---is recorded in our D1 database."
- **Action**: Point to the **Multi-Agent Status Board**. Show the "Verifier Agent" checking DOI integrity.
- **Narration**: "This is our White-box evidence. If a paper is excluded, the trace tells us exactly why (e.g., Journal not in FT50/S-tier)."

## 3. Paper Detail & Score Breakdown (2 minutes)
- **Start**: Return to `/dashboard/research`.
- **Action**: Select the top-ranked paper.
- **Narration**: "In the Ranked Papers table, we see results that have passed our quality gate. We can inspect the 'Score Breakdown'."
- **Action**: Point to relevance, journal fit, and recency scores.
- **Narration**: "The scores are derived from transparent metadata. We also show Open Access status via Unpaywall, ensuring researchers can actually access the findings."

## 4. Evaluation & Benchmark (2 minutes)
- **Start**: Navigate to the Evaluation Dashboard (`/dashboard/evaluation`).
- **Narration**: "To evaluate the workflow, we built 'Paper-Agent-Bench'. We compare the Multi-Agent approach against Rule-based and Single-LLM baselines using repository-grounded artifacts."
- **Action**: Show the comparison table.
- **Narration**: "In the T001-T003 controlled sample, the Proposed Agent maintains 100% Top-Journal Precision and DOI presence. The Single-LLM baseline has higher exact gold overlap in this snapshot, while the Multi-Agent workflow emphasizes live search traceability and quality-control enforcement."

## 5. Deliverables & Conclusion (1 minute)
- **Action**: Click the **Download PDF Report** button.
- **Narration**: "Finally, Paper Agent delivers a synthesized narrative report stored in Cloudflare R2. It includes Findings, Themes, and Research Gaps, ready for human critical review."
- **End**: "Paper Agent demonstrates a traceable, quality-controlled path for literature review automation, with remaining limitations documented for human review."

---
**Status**: Script Drafted. (gemini)
