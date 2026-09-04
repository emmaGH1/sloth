# Sloth handover

## Status

**Checkpoint 23 — pre-video truthfulness fixes complete, verified and committed locally; not yet deployed.** Production https://sloth-webmcp.vercel.app still runs tagged app `checkpoint-22` (`a657f5e`). This checkpoint removes native/simulation ambiguity, keeps the authority rail at 04 until fifth-tool registration succeeds, makes the single-use batch policy explicit, removes stale “Live”/TTL state after consumption, replaces fake time identifiers, and removes the rejected running-sloth artwork from the rendered app. Deploy only after the checks below remain green.

The final submission strategy, honesty matrix, release gate, video script and WAT clock are maintained in [`PLAYBOOK.md`](../PLAYBOOK.md). Treat it as the execution source of truth; this handover remains the technical state record.

## Product in one sentence

**Delegate outcomes, not unlimited access.** A payment-operations agent begins with narrow baseline tools, asks for a precise temporary refund capability only when needed, is enforced by that grant, adapts to violations, and loses the capability when the grant is consumed, denied, ended, or expired.

## Current implementation

- Four baseline WebMCP tools register on load: `inspect_issues`, `inspect_transaction`, `retry_payment`, `request_capability`.
- `retry_payment` is a constrained pre-authorized mutation. `PAY-17` succeeds; `TX-48` returns `PREAUTHORIZED_POLICY_VIOLATION`.
- `request_capability` payload is the approval-card source of truth (`transactions`, `maxAmount`, `maxTotalAmount`, `reason`). After deny, later native requests return `DO_NOT_RETRY`.
- Approving registers `refund_scoped_transactions`. It enforces IDs, per-item cap, aggregate cap with `spentAmount`, and structured `SCOPE_VIOLATION`. One in-scope batch success unregisters it (05 → 04) on both the native tool path and the console execute button. The tool description tells the agent to submit every intended refund in one array.
- Grant TTL is 600s (shown as ~10:00) with Fast-forward. Consume, deny, end, and expiry all drop the fifth tool.
- Large hero restored; console sits directly under it; architecture is a short strip. The rendered brand uses a simple S mark and the hero shows the 04 → 05 → 04 lifecycle; the rejected running-sloth artwork is no longer referenced.
- README is a **single native WebMCP judge path**. Track B / console replay is not a judge track; native mode no longer presents a replay launcher as its primary action.

## Verified

- `npm test`: 22/22. `npm run build`: passes after Checkpoint 23 changes.
- Local fallback (simulation): request card `$184` / `$304`; TTL ~10 minutes; TX-999 stays `SCOPE_VIOLATION` with rail `05`; in-scope execute consumes to `04`.
- Production HTML matches the tagged app (`Open console`, `maxTotalAmount: 304`).
- **Not verified here:** native ChatGPT / Inspector 4 → 5 → 4 on the live URL.

## Risks

- Native 4 → 5 → 4 is not in unit tests (browser registry only).
- A slow native session can still burn the 10-minute TTL. Fast-forward is a fallback affordance, not the recorded climax.
- Tag `checkpoint-22` is two docs commits behind `main`. Freeze/submit against the tagged app unless you retag after a code change.

## Devpost testing (paste)

**Live app:** https://sloth-webmcp.vercel.app  
**Repo:** https://github.com/emmaGH1/sloth (MIT)

Native WebMCP only. Header must read **WebMCP / Native Live**. If it says Simulation, stop and switch browsers.

Chrome 149+ with `chrome://flags/#enable-webmcp-testing`, or ChatGPT’s in-app browser. Prompt:

```
Clean up today’s payment problems. Only bother me when you actually need my authority.
```

You should see: four tools (no refund) → counts unmask → authority card from the payload → Adjust to $72 / item and $150 aggregate → fifth tool appears → out-of-scope call returns SCOPE_VIOLATION (rail stays 05) → TX-48 and TX-72 refund → tool gone (rail 04).

## What’s left (human)

1. Obtain explicit approval to push current local `main`, confirm the deployment, then walk the native path on the live URL. If it fails, that is the only remaining code work.
2. Record it once, under three minutes (console beside ChatGPT/Inspector; nine PRD beats; no Fast-forward/architecture climax).
3. Paste Devpost description + testing instructions from this file / README.
4. Freeze. Do not keep editing after the video.

## NEXT ACTION

Obtain explicit approval to push current local `main`, confirm the deployment, and walk native evaluation on https://sloth-webmcp.vercel.app with header **Native Live**, including the 04 → registering → 05 transition and one valid refund batch. Then record and freeze.
