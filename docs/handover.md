# Sloth handover

## Status

**Checkpoint 22 shipped.** Honesty pass is on `main` (`a657f5e`, tag `checkpoint-22`) and production `https://sloth-webmcp.vercel.app`. Next human step is a native Track A walk + sub-3-minute recording. No more product work unless Track A fails.

## Product in one sentence

**Delegate outcomes, not unlimited access.** A payment-operations agent begins with narrow baseline tools, asks for a precise temporary refund capability only when needed, is enforced by that grant, adapts to violations, and loses the capability when the grant is consumed, denied, ended, or expired.

## What changed in this pass

- `request_capability` payload now requires and preserves `maxTotalAmount`. Approval card and grant come from that payload; the `$150`/`$304` slider magic is gone. Human Adjust sets per-item and aggregate independently.
- Aggregate enforcement is cumulative (`spentAmount` + this batch). In-scope success consumes the grant on **both** the native tool path and **Execute verified refunds**.
- Deny uses a `phaseRef`, so native `request_capability` actually returns `DO_NOT_RETRY`.
- TTL is **600s (10:00)** with Fast-forward. 60s was dropping the native tool before ChatGPT could refund.
- Boundary buttons log `summarizeRefundResult(response)` instead of hardcoded rejections.
- Console stays directly under the hero; architecture is a short strip, not `100vh`. Large hero scale restored (type, padding, 380px graphic). Running-sloth logo kept.
- README/handover match the UI. Canonical ChatGPT prompt lives in the README. Audit export is a client-side JSON dump, not a compliance ledger.

## Current implementation

- Four baseline WebMCP tools register on load: `inspect_issues`, `inspect_transaction`, `retry_payment`, and `request_capability`.
- `retry_payment` is a constrained, idempotent pre-authorized mutation. `PAY-17` is accepted; arbitrary IDs such as `TX-48` return `PREAUTHORIZED_POLICY_VIOLATION`.
- `request_capability` validates capability, verified transaction IDs, `maxAmount`, `maxTotalAmount`, and reason. Its payload is the source of truth for the human approval card.
- Approving a request dynamically registers `refund_scoped_transactions`. It enforces immutable approved IDs, per-transaction cap, aggregate cap with spend, and structured `SCOPE_VIOLATION` errors. A successful in-scope call unregisters it (05 → 04).
- Active grant shows a 10-minute TTL countdown. Fast-forward simulates expiry. Consume, end, deny, and expiry all drop the fifth tool.
- Hard denial lock: operator denial engages a `DO_NOT_RETRY` machine-readable response, including on later native `request_capability` calls.
- Audit export writes `sloth-run-audit-[timestamp].json` from current UI state.

## Verified state

- `npm test`: 22/22 passing unit tests.
- `npm run build`: passes.
- GitHub `main` and tag `checkpoint-22` = `a657f5e`.
- Production: https://sloth-webmcp.vercel.app (Open console, `maxTotalAmount: 304` in architecture snippet).
- Browser fallback previously verified locally: request card `$184` / `$304`; TTL ~10 minutes; TX-999 stays `SCOPE_VIOLATION` with rail `05`; in-scope execute consumes to rail `04`.
- Native Track A (ChatGPT / Inspector) is **not** verified from this session.

## Risks

- Native 4 → 5 → 4 is still not covered by unit tests (browser registry only).
- A 10-minute TTL can still expire a very slow native session; Fast-forward is for fallback demos, not the happy path.

## Devpost testing instructions (paste)

**Live app:** https://sloth-webmcp.vercel.app  
**Repo:** https://github.com/emmaGH1/sloth (MIT)

The header chip is the mode. **WebMCP / Native Live** = real tools. **WebMCP / Simulation** = labelled replay, not native proof. Do not click Launch Delegated Run if you are evaluating native tools.

**Track A (recommended).** Chrome 149+ with `chrome://flags/#enable-webmcp-testing`, or ChatGPT’s in-app browser. Prompt:

```
Clean up today’s payment problems. Only bother me when you actually need my authority.
```

You should see: four tools (no refund) → investigation counts unmask → authority card from the agent payload → Adjust to $72 / item and $150 aggregate → fifth tool appears → out-of-scope call returns SCOPE_VIOLATION → TX-48 and TX-72 refund → tool gone (rail 04).

**Track B (no WebMCP).** Click Launch Delegated Run, Adjust $72 / $150, Confirm revised grant, probe TX-999, Execute verified refunds (single-use).

## NEXT ACTION

Walk Track A on https://sloth-webmcp.vercel.app in Chrome/ChatGPT with Native Live. If it holds, record the nine PRD beats under three minutes (console beside Inspector; do not climax on Fast-forward or architecture). Then freeze.
