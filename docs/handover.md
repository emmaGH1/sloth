# Sloth handover

## Status

**Product freeze is tagged. Docs on `main` are newer.** App code is `checkpoint-22` (`a657f5e`). GitHub `main` is `1e47c79` (two docs commits after the tag: ship notes, then native-only README). Production https://sloth-webmcp.vercel.app was deployed from `a657f5e`. No further product work unless native evaluation fails.

## Product in one sentence

**Delegate outcomes, not unlimited access.** A payment-operations agent begins with narrow baseline tools, asks for a precise temporary refund capability only when needed, is enforced by that grant, adapts to violations, and loses the capability when the grant is consumed, denied, ended, or expired.

## Current implementation

- Four baseline WebMCP tools register on load: `inspect_issues`, `inspect_transaction`, `retry_payment`, `request_capability`.
- `retry_payment` is a constrained pre-authorized mutation. `PAY-17` succeeds; `TX-48` returns `PREAUTHORIZED_POLICY_VIOLATION`.
- `request_capability` payload is the approval-card source of truth (`transactions`, `maxAmount`, `maxTotalAmount`, `reason`). After deny, later native requests return `DO_NOT_RETRY`.
- Approving registers `refund_scoped_transactions`. It enforces IDs, per-item cap, aggregate cap with `spentAmount`, and structured `SCOPE_VIOLATION`. An in-scope success unregisters it (05 → 04) on both the native tool path and the console execute button.
- Grant TTL is 600s (shown as ~10:00) with Fast-forward. Consume, deny, end, and expiry all drop the fifth tool.
- Large hero restored; console sits directly under it; architecture is a short strip. Running-sloth logo kept.
- README is a **single native WebMCP judge path**. Track B / console replay is not a judge track. Do not click Launch Delegated Run when evaluating.

## Verified

- `npm test`: 22/22. `npm run build`: passes.
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

Native WebMCP only. Header must read **WebMCP / Native Live**. If it says Simulation, stop. Do not click Launch Delegated Run.

Chrome 149+ with `chrome://flags/#enable-webmcp-testing`, or ChatGPT’s in-app browser. Prompt:

```
Clean up today’s payment problems. Only bother me when you actually need my authority.
```

You should see: four tools (no refund) → counts unmask → authority card from the payload → Adjust to $72 / item and $150 aggregate → fifth tool appears → out-of-scope call returns SCOPE_VIOLATION (rail stays 05) → TX-48 and TX-72 refund → tool gone (rail 04).

## What’s left (human)

1. Walk that native path on the live URL. If it fails, that is the only code work.
2. Record it once, under three minutes (console beside ChatGPT/Inspector; nine PRD beats; no Fast-forward/architecture climax).
3. Paste Devpost description + testing instructions from this file / README.
4. Freeze. Do not keep editing after the video.

## NEXT ACTION

Walk native evaluation on https://sloth-webmcp.vercel.app with header **Native Live**. Then record and freeze.
