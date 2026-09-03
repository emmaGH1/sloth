# Sloth handover

## Status

**Checkpoint 18 — investigation findings are tool-driven.** Sloth is publicly live at `https://sloth-webmcp.theboyemma.chatgpt.site`. The public GitHub repository is `https://github.com/emmaGH1/sloth.git` and includes an MIT license. The deployed application is still Sites version 5 from source commit `a159a7e`. Source on `main` now includes the tool-driven investigation batch and needs a Sites save/deploy.

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
- Investigation counts start empty (`—`) and appear only when the matching tool runs: `inspect_issues` reveals reviewed issues and confirmed duplicates, `inspect_transaction` accumulates verified duplicates, and successful `retry_payment` calls accumulate retries. A blocked retry does not increment the count.
- When native WebMCP is online, the hero tells the agent to investigate by calling tools. **Replay demo path** is a labelled fallback, not the primary proof. Without native WebMCP, **Start delegated run** still replays the story under **Demo replay mode**.
- The header reads `Payment operations / controlled scenario` and presents a composed `WebMCP / Native tools online` status; it falls back to `Demo replay mode` when native WebMCP is unavailable.

## Verified state

- `npm test`: 15 passing request, retry-policy, scope, planning, and investigation-finding tests (2026-09-03).
- `npm run build`: passes (2026-09-03).
- GitHub was tested anonymously with credentials disabled and is public.
- The public Sites URL returned HTTP 200 without a signed-in session.
- Fresh public native Chrome verification on 2026-09-03 with Chrome 152.0.7977.75, `enable-webmcp-testing`, and Google’s Model Context Tool Inspector (`gbpdfapgefenggkahomfgkhfehlcenpd` 1.9.13). Native `document.modelContext.getTools()` / `executeTool()` were used — the same APIs the Inspector uses:

  1. Header showed `WebMCP / Native tools online`.
  2. Exactly four baseline tools existed; `refund_scoped_transactions` was absent; authority rail showed `04`.
  3. `inspect_issues` returned 14 issues, 3 confirmed duplicates, and the retryable payment list.
  4. `retry_payment` `{ "id": "PAY-17" }` returned `retry_queued` with the one-attempt idempotent policy.
  5. `retry_payment` `{ "id": "TX-48" }` returned `PREAUTHORIZED_POLICY_VIOLATION`.
  6. `request_capability` with transactions `TX-48`, `TX-72`, `TX-184`, `maxAmount` 184, and reason `Confirmed duplicate charges` opened the page request card from that payload.
  7. Adjusting the grant to $72 registered the fifth tool; rail showed `05`; grant strip read `Live · 3 transactions · ≤ $72`.
  8. `refund_scoped_transactions` with `TX-999` / `$220` returned one `SCOPE_VIOLATION` (`TRANSACTION_NOT_ALLOWED`, `AMOUNT_OVER_GRANT`).
  9. In-scope refunds of TX-48 and TX-72 succeeded; TX-184 stayed untouched under the $72 cap.
  10. Ending the run removed `refund_scoped_transactions`; tool count and rail returned to four.

- Local native retest of the investigation batch on `http://localhost:3000` with the same Inspector APIs: idle counts were `— / — / —`; `inspect_issues` revealed `14` and `03` while retries stayed hidden; `PAY-17` incremented retries to `01`; `TX-48` stayed blocked and did not increment; native `request_capability` still opened the grant card; 4 → 5 → 4, `SCOPE_VIOLATION`, and in-scope refunds still passed; reset hid the counts again; labelled **Replay demo path** then revealed `14 / 03 / 08` and the request card.

## Risks / open items

- The public chatgpt.site deployment is still Sites version 5 (`a159a7e`) and does not yet include the tool-driven investigation UI. This Grok session does not have ChatGPT Sites save/deploy tools. After push, save a version from the investigation commit and deploy it to the existing public URL.
- WebMCP remains a preview API and requires the appropriate browser support or testing flag. The app degrades visibly and safely if unavailable.
- Do not ship the Pinterest-derived running-sloth logo.

## Operating rules

- Read `AGENTS.md` and `docs/prd-lite.md` before changing product behavior.
- Update this handover after every meaningful checkpoint; make a clear commit and push it.
- Run `npm test` and `npm run build` after code changes.
- When changing the public site, follow the Sites build/hosting workflow and deploy the exact committed source.

## NEXT ACTION

Save and deploy the investigation-batch commit to the existing public ChatGPT Site (`https://sloth-webmcp.theboyemma.chatgpt.site`), then repeat the native Inspector path on the live URL to confirm idle counts stay hidden until tool calls.
