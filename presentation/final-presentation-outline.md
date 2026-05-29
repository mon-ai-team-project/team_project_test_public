# Final Presentation Outline

Updated: 2026-05-29 (gemini)

Target duration: 8 minutes plus Q&A.

## Slide 1 - Title And Claim

Title: Paper Agent: From Black-Box AI to Traceable Multi-Agent Research
Subtitle: Automating Academic Rigor in Business Literature Review

Key message: We move beyond generative AI "hallucinations" to a 12-stage modular system that executes real scholarly searches with traceable top-journal compliance in the controlled sample.

## Slide 2 - Problem: The Traceability Gap

- Literature review is fragmented across disconnected tools (WoS, Crossref, Unpaywall).
- Naive LLMs are "Black-boxes": they hide hallucinations and bypass academic gatekeeping.
- Pain points: Tool fragmentation, opaque selection bias, and lost reasoning.

## Slide 3 - Agent Architecture: Agent-as-a-Module

Show the 12-stage workflow:
Planner -> Journal Selector -> Search/Retriever -> Verifier -> Open Access -> Storage -> Evaluation -> Relevance -> Ranking -> Critic -> Report -> Dashboard Delivery.

- **Design Rationale**: Error isolation and explicit decision-making.
- Each agent records its intent and output in D1 `agent_traces`.

## Slide 4 - System Implementation: Deployed Rigor

Show the Cloudflare stack:
- Pages (UI) + Worker (Logic) + D1 (Traces) + R2 (Artifacts) + AI/Vectorize (opt-in paths).
- **Tool-Use**: Real-time integration with Web of Science, Crossref, and Unpaywall.

## Slide 5 - Live Demo sequence

1. **Research Studio**: Trigger a live search.
2. **Agent Board**: Watch the 12 stages execute in real-time.
3. **Synthesis**: Inspect the narrative PDF report with narrative Findings/Gaps.
4. **Ops Center**: Show the D1 trace log (The "White-box" evidence).

## Slide 6 - Benchmark: Paper-Agent-Bench

- 20 tasks, DOI-backed gold labels, repository-controlled artifacts.
- Metrics: Precision@5, NDCG@5, and **Top-Journal Precision**.
- Automated audit scripts ensure evaluation integrity.

## Slide 7 - Results: Quality over Popularity

Insert T001-T003 Summary:
- Proposed Agent: **100% Top-Journal Precision**, 100% DOI Presence.
- Single-LLM: Higher overlap (recall) but lower quality compliance (0.93 prec).
- **Interpretation**: Our system makes academic quality checks inspectable where generic AI can hide process.

## Slide 8 - Why Multi-Agent? (Strategic Advantage)

Map failure modes to accountability:
- Verifier Agent catches DOI errors.
- Critic Agent detects hallucination risks.
- Traceability allows human researchers to "audit" the machine.

## Slide 9 - Limitations and Algorithmic Gatekeeping

- **Ethical Disclosure**: Our journal allowlist introduces gatekeeping bias.
- Provider quotas affect retrieval depth.
- AI bias in qualitative critic must be monitored via Agent Traces.

## Slide 10 - Conclusion

Paper Agent is a deployed prototype proving that:
1. Multi-Agent workflows provide the "White-box" accountability academics need.
2. 12 specialized modules make metadata checks and exclusion reasons inspectable.
3. Deployed architecture (Cloudflare) supports reproducible demos and artifact downloads.
