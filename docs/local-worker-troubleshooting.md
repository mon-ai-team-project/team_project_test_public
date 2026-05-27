# Local Worker Troubleshooting

Updated: 2026-05-26 (codex)

Use this file when the Worker appears abnormal in local development or after Gemini/Codex refactors.

## Gemini Mandatory Handoff

Gemini must also read `docs/gemini-debug-handoff.md` before changing Worker code or config. The debug handoff records the exact production/local checks that were confirmed by Codex. (codex)

## Current Confirmed Status

- Production Worker read-only smoke passed against `https://paper-agent-project.shch3653.workers.dev`. (codex)
- Production Worker search smoke passed with `maxResults=1`, job `job-1ce620dd-1588-474c-b07b-61f76010e33b`, and CSV/Markdown/XLSX/PDF endpoints returned HTTP 200. (codex)
- Local Worker starts with Wrangler when the port flag is passed directly to the workspace dev script. (codex)

## Correct Local Commands

Start local Worker:

```bash
npm run dev:worker:local
```

In a second terminal, run local read-only smoke:

```bash
npm run smoke:worker:local
```

Equivalent direct workspace commands:

```bash
npm run dev --workspace apps/worker -- --port 8787
npm run smoke:local --workspace apps/worker
```

## Avoid This Command

Do not use:

```bash
npm run dev:worker -- --port 8787
```

In this repository, that command can be forwarded as `wrangler dev 8787`, causing Wrangler to treat `8787` as an entry-point file and fail with:

```text
The entry-point file at "8787" was not found.
```

## Local Diagnostics Expectations

Without local secrets, `/api/diagnostics` can return:

```json
{
  "ok": false,
  "env": {
    "wosApiKey": false,
    "openAlexEmail": false,
    "crossrefEmail": false,
    "unpaywallEmail": false,
    "googleDrive": false
  },
  "readiness": {
    "activeProviderReady": false
  }
}
```

That is expected for local development unless `.dev.vars` is configured. Health and schema checks can still pass.

## Optional Local `.dev.vars`

Create `apps/worker/.dev.vars` locally if search execution is needed. Do not commit it.

```text
SEARCH_PROVIDER=openalex
OPENALEX_EMAIL=<contact email>
OPENALEX_API_KEY=<optional key>
CROSSREF_EMAIL=<contact email>
UNPAYWALL_EMAIL=<contact email>
```

For WoS local runs, use `SEARCH_PROVIDER=wos` and add `WOS_API_KEY`.

## Wrangler RPC Noise

Wrangler local dev may print workerd RPC messages such as `NOSENTRY RPC connection broken`. If `/api/health` returns `ok: true` and local smoke passes, treat this as local workerd noise unless requests fail.

## Current AI/Vectorize Status

- LLM Critic and Vectorize code paths are optional. (codex)
- Tracked Wrangler configs intentionally do not bind `AI` or `VECTOR_INDEX` until a human confirms Cloudflare resource setup. (codex)
- Local diagnostics should therefore not be expected to show AI/Vectorize readiness yet. (codex)
