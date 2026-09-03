# Sloth handover

## Status

**Checkpoint 21 — Multi-part discrete commits complete & verified.** All 4 code parts are cleanly committed to local `main`:
- Part 1 `319e22c`: `feat(scope): enforce aggregate blast radius cap and cumulative batch validation`
- Part 2 `031277f`: `feat(assets): add brand logo metadata, favicon, and hero graphic`
- Part 3 `5e85ed5`: `feat(ui): 5-section presentation styling, 100vh architecture layout, and de-sloppified WebMCP radar pill`
- Part 4 `bb01b3d`: `feat(console): 60s TTL countdown, single-use auto-revocation, 3-boundary test suite, and audit export`

The public GitHub repository is `https://github.com/emmaGH1/sloth.git` (MIT). Test suite verified at 17/17 passing tests.

## Product in one sentence

**Delegate outcomes, not unlimited access.** A payment-operations agent begins with narrow baseline tools, asks for a precise temporary refund capability only when needed, is enforced by that grant, adapts to violations, and loses the capability at the end of the run.

## Current implementation

- Four baseline WebMCP tools register on load: `inspect_issues`, `inspect_transaction`, `retry_payment`, and `request_capability`.
- `retry_payment` is a constrained, idempotent pre-authorized mutation. `PAY-17` is accepted; arbitrary IDs such as `TX-48` return `PREAUTHORIZED_POLICY_VIOLATION`.
- `request_capability` validates capability, verified transaction IDs, maximum amount, and reason. Its payload is the source of truth for the human approval card.
- Approving a request dynamically registers `refund_scoped_transactions`. It enforces immutable approved IDs, per-transaction cap ($72), and aggregate batch cap ($150) with structured `SCOPE_VIOLATION` errors.
- Active capability grant features a 60-second Time-To-Live (TTL) countdown with automatic capability unregistration upon expiration, and interactive fast-forward simulation.
- Single-use auto-revocation: executing verified refunds automatically unregisters the mutation tool immediately (05 → 04) without waiting for TTL expiration, eliminating the replay attack window.
- Interactive 3-boundary test suite: dedicated controls to test unapproved IDs (`TX-999`), unit cap breaches (`$184`), and aggregate batch cap breaches (`$192`).
- Hard denial lock: operator denial engages a `DO_NOT_RETRY` machine-readable response to halt agent looping.
- Evaluator prompt copy: one-click copy chip in Hero and Console Header with canonical instruction for ChatGPT Desktop (GPT-5.6 Sol/Terra) and Chrome Inspector.
- Audit ledger export: generates structured `sloth-run-audit-[timestamp].json` containing full provenance: intent, findings, requests, human adjustments, execution diffs, and revocation events.

## Verified state

- `npm test`: 17/17 passing unit tests (2026-09-03).
- `npm run build`: passes cleanly in <2s (2026-09-03).
- `http://localhost:3000/` and `http://localhost:3000/favicon.ico`: HTTP 200.
- All commits structured in atomic parts for isolation and rollback safety.

## NEXT ACTION

Push commits to GitHub origin and deploy to Vercel (`vercel --prod`) to update the live production submission URL.
