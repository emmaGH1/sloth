# Sloth handover

## Status

**Checkpoint 20 — Comprehensive README rewrite & engineering showcase complete.** The public GitHub repository is `https://github.com/emmaGH1/sloth.git` (MIT). Production deployment is live at `https://sloth-webmcp.vercel.app`. Test suite verified at 17/17 passing tests.

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
- Approving a request dynamically registers `refund_scoped_transactions`. It enforces immutable approved IDs, per-transaction cap, and aggregate batch cap (`maxTotalAmount`) with structured `SCOPE_VIOLATION` errors.
- Active capability grant features a 60-second Time-To-Live (TTL) countdown with automatic capability unregistration upon expiration, and interactive fast-forward simulation.
- Audit ledger export: generates structured `sloth-audit-ledger-[timestamp].json` containing every intent, tool call, violation, and revocation event.
- Adjusting to $72 refunds TX-48 and TX-72 while deferring TX-184. Ending a run removes the temporary tool.
- Investigation counts start empty (`—`) and appear only when the matching tool runs: `inspect_issues` reveals reviewed issues and confirmed duplicates, `inspect_transaction` accumulates verified duplicates, and successful `retry_payment` calls accumulate retries. A blocked retry does not increment the count.
- When native WebMCP is online, the hero tells the agent to investigate by calling tools. **Replay demo path** is a labelled fallback, not the primary proof. Without native WebMCP, **Start delegated run** still replays the story under **Demo replay mode**.
- The header reads `Payment operations / controlled scenario` and presents a composed `WebMCP / Native tools online` status; it falls back to `Demo replay mode` when native WebMCP is unavailable.
- README overhauled with Mermaid sequence diagram, state machine lifecycle (4 → 5 → 4), exact JSON schemas, dual-track judge reproduction guide (Track A: Native WebMCP / Inspector, Track B: 1-Click Interactive Console), and enterprise impact framing.

## Verified state

- `npm test`: 17 passing request, retry-policy, scope, planning, dual-cap, and investigation-finding tests (2026-09-03).
- `npm run build`: passes cleanly (2026-09-03).
- GitHub tested anonymously with credentials disabled and is public.
- Production Vercel deployment (`https://sloth-webmcp.vercel.app`) returns HTTP 200 without sign-in session.
- Native Chrome 152 + WebMCP Inspector verification passed: 4 baseline tools → request → adjust to $72 → 5 tools with 60s TTL → `SCOPE_VIOLATION` rejection on TX-999 / $220 → valid batch execution → automatic/manual capability revocation returning to 4 tools.

## Risks / open items

- ChatGPT Sites remains on version 5 (`a159a7e`) until Codex usage resets (7 Sep), which is after the submission freeze. Do not wait on it; use primary Vercel deployment.
- WebMCP remains a preview API and requires the appropriate browser support or testing flag. The app degrades visibly and safely if unavailable.
- Do not ship the Pinterest-derived running-sloth logo.

## Operating rules

- Read `AGENTS.md` and `docs/prd-lite.md` before changing product behavior.
- Update this handover after every meaningful checkpoint; make a clear commit and push it.
- Run `npm test` and `npm run build` after code changes.
- When changing the public site, follow the Sites build/hosting workflow and deploy the exact committed source.

## NEXT ACTION

Record/upload the 3-minute video walkthrough, paste the YouTube link into the README and Devpost submission, and submit on Devpost before deadline freeze.
