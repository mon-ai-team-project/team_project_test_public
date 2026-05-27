## Summary

- 

## Assignment

- [ ] I read `AGENTS.md`
- [ ] I read `docs/agent-writing-rules.md`
- [ ] I read my agent-specific guide if applicable: `GEMINI.md` or `CLAUDE.md`
- [ ] I read `docs/agent-work-queue.md`
- [ ] Branch name matches the assigned task
- [ ] Changed files stay within the assigned scope
- [ ] Personal folder / work-log was updated for my assignment

## Verification

- [ ] `npm run validate:agent-rules`
- [ ] `npm run typecheck`
- [ ] Relevant build, dry-run, or manual check completed
- [ ] Benchmark-only changes: `npm run benchmark:evaluate-proposed`

## Strict Changelog Requirement

- [ ] `CHANGELOG.md` has been updated in this PR
- [ ] Every meaningful source, config, docs, schema, prompt, benchmark, or deployment change is recorded
- [ ] The changelog entry includes a clear label and affected path when practical

PRs that skip `CHANGELOG.md` for meaningful changes should not be merged.
