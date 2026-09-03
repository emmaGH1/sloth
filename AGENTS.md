# Sloth contributor guide

## Product focus

Sloth is a demo-first operations console for **delegated outcomes with scoped authority**. The one judge path is: intent → investigation → narrow capability request → approval/adjustment/denial → scoped refund execution → capability expiry.

## Working rules

- Prioritize the documented happy path over breadth, integrations, and production infrastructure.
- Preserve real capability boundaries: an unavailable action must not be callable until approval exposes it.
- Keep every grant narrow, visible, and revocable. Validate scope in the tool implementation, never only in the UI.
- Update `docs/handover.md` after every meaningful checkpoint with status, verification, risks, and one next action.
- Make a clear Git commit at every meaningful checkpoint. Do not bundle unrelated work.
- Do not add authentication, databases, payment providers, or deployment dependencies unless the single demo path cannot work without them.

## Verification standard

- Run the project’s available checks after each feature checkpoint.
- Manually verify the main flow: start run, request, approve, reject an out-of-scope refund, execute in-scope refunds, finish and remove authority.
- Keep a browser-test fallback in the handover notes if native WebMCP testing is unavailable.
