# Sloth handover

## Status

**Checkpoint 16 — session handoff prepared.** Sloth is publicly live at `https://sloth-webmcp.theboyemma.chatgpt.site`. The public GitHub repository is `https://github.com/emmaGH1/sloth.git` and includes an MIT license. The deployed application is Sites version 5 from source commit `a159a7e`; current `main` (`476ddb3`) only adds this handover record.

## Product in one sentence

**Delegate outcomes, not unlimited access.** A payment-operations agent begins with narrow baseline tools, asks for a precise temporary refund capability only when needed, is enforced by that grant, adapts to violations, and loses the capability at the end of the run.

## Locked decisions

- Optimize one flawless judge path, not product breadth.
- Keep the simple in-product “S” mark. The supplied running-sloth image was derived from a Pinterest reference and must not be shipped.
- No authentication, real payments, customer data, database, or multi-user workflow.
- “Sloth” is a hackathon working name only; do not claim trademark exclusivity.
- Keep the existing ChatGPT Sites URL. Removing `theboyemma.chatgpt.site` requires a separate custom domain.

## Current implementation

- Four baseline WebMCP tools register on load: `inspect_issues`, `inspect_transaction`, `retry_payment`, and `request_capability`.
- `retry_payment` is a constrained, idempotent pre-authorized mutation. `PAY-17` is accepted; arbitrary IDs such as `TX-48` return `PREAUTHORIZED_POLICY_VIOLATION`.
- `request_capability` validates capability, verified transaction IDs, maximum amount, and reason. Its payload is the source of truth for the human approval card.
- Approving a request dynamically registers `refund_scoped_transactions`. It enforces the immutable approved IDs and cap with structured `SCOPE_VIOLATION` errors.
- Adjusting to $72 refunds TX-48 and TX-72 while deferring TX-184. Ending a run removes the temporary tool.
- The header reads `Payment operations / controlled scenario` and presents a composed `WebMCP / Native tools online` status; it falls back to `Demo replay mode` when native WebMCP is unavailable.

## Verified state

- `npm test`: 12 passing request, retry-policy, scope, and planning tests (2026-09-03).
- `npm run build`: passes (2026-09-03).
- GitHub was tested anonymously with credentials disabled and is public.
- The public Sites URL returned HTTP 200 without a signed-in session.
- Earlier native Chrome Inspector QA passed the original 4 → 5 → 4 lifecycle, adjusted-grant behavior, denial, replay, and out-of-scope structured error.

## Important open verification

The current public release needs one fresh native WebMCP retest because its scope-request and retry-policy contracts changed after the earlier Inspector test.

1. Open the public URL in Chrome with WebMCP Inspector enabled and confirm `WebMCP / Native tools online`.
2. Confirm exactly four baseline tools exist.
3. Call `inspect_issues`, then call `retry_payment` with `{ "id": "PAY-17" }` and verify success.
4. Call `retry_payment` with `{ "id": "TX-48" }` and verify `PREAUTHORIZED_POLICY_VIOLATION`.
5. Call `request_capability` with:

   ```json
   {
     "capability": "refund_scoped_transactions",
     "scope": {
       "transactions": ["TX-48", "TX-72", "TX-184"],
       "maxAmount": 184
     },
     "reason": "Confirmed duplicate charges"
   }
   ```

6. Approve or adjust the request in the page; confirm the fifth tool appears and enforces the granted scope.
7. Call the refund tool with `TX-999` to verify one `SCOPE_VIOLATION`; complete valid refunds; end the run and confirm the tool count returns to four.

## Next product batch

Make the investigation state truthful and agent-driven:

- Hide completed investigation findings until their corresponding native tool calls occur; the idle screen currently exposes the finished counts too early.
- Let natural-language agent tool calls advance the judge path, with deterministic replay clearly labelled as fallback rather than the primary proof.
- Preserve the verified 4 → 5 → 4 lifecycle and do not begin a broad visual redesign before this behavior is real.

## Operating rules

- Read `AGENTS.md` and `docs/prd-lite.md` before changing product behavior.
- Update this handover after every meaningful checkpoint; make a clear commit and push it.
- Run `npm test` and `npm run build` after code changes.
- When changing the public site, follow the Sites build/hosting workflow and deploy the exact committed source.

## NEXT ACTION

Run the public native WebMCP verification above. If it passes, implement the truthful, tool-driven investigation state as the next focused batch.
