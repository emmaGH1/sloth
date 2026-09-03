# Sloth handover

## Status

**Checkpoint 13 — judge access verified.** The repository includes an MIT license and is anonymously readable. `request_capability` now validates and preserves the exact transaction IDs, maximum amount, and reason rendered to the human; the approved copy becomes the immutable refund grant. `retry_payment` now enforces a named, inspected-failure pre-authorization policy. Sloth Sites version 4 is live publicly at `https://sloth-webmcp.theboyemma.chatgpt.site`.

## Locked decisions

- Core line: **Delegate outcomes, not unlimited access.**
- Demo path: intent → investigate safe issues → request narrowly scoped refund authority for three verified duplicates → human approves/adjusts/denies → dynamically expose the scoped tool → enforce scope with structured errors → agent adapts → revoke authority at completion.
- Optimize for one flawless judge path. No auth, real payments, database, or multi-user system.
- User reports both ChatGPT Site Tools/WebMCP and WebMCP-enabled Chrome are available for later verification.

## Current test state

- Repository cloned successfully from `https://github.com/emmaGH1/sloth.git`.
- Repository had no commits or files on `main`.
- Static application created: `index.html`, `styles.css`, and `app.js`.
- The page uses `document.modelContext.registerTool` (with a legacy `navigator.modelContext` fallback) when available. Four safe tools register on page load, while the refund tool is registered only after a grant and removed with `AbortController.abort()`.
- The visual fallback mirrors the same scope-enforcement logic and produces a structured `SCOPE_VIOLATION` response.
- Scope validation is isolated in `scope.js` and covered by `node --test tests/scope.test.mjs` for the approved, unapproved, and over-limit cases.
- Verified locally: `node --check app.js`, `node --test tests/scope.test.mjs` (3 passing), whitespace diff check, and an HTTP 200 response from the local preview server.
- Published commits on `main`: `a5746a5` (controls and handover) and `2628dcc` (full demo implementation).
- Migrated the static prototype into a single-route React client app using the Sites starter runtime and `.openai/hosting.json`.
- `npm test` passes all 3 scope-enforcement tests and `npm run build` produces the required `dist/server/index.js` bundle.
- Added and verified a bespoke Sloth social-preview card with exact brand copy and host-derived Open Graph/X metadata.
- Production deployment succeeded on ChatGPT Sites and was opened in the Codex browser panel.
- Correctness fixes: rejected instructions are reported once with explicit violation reasons; empty batches, duplicate IDs, non-positive/non-numeric amounts, over-grant amounts, and refunds above the original charge are rejected.
- Adjusted grants now execute only covered refunds and visibly defer transactions outside the human-approved cap instead of reporting a false full success.
- Successful native WebMCP refund calls now update the visible outcome state as well as returning the structured result.
- `npm test` now passes 12 focused request, retry-policy, scope, and planning tests; the Sites production build succeeds.
- Live QA found and corrected a browser compatibility issue in the adjustment slider by binding the direct input event; the displayed and granted cap now follows pointer/keyboard changes.
- Live Sites QA passed: a $72 adjusted grant exposes the temporary tool, returns one deduplicated structured rejection for `TX-999`, refunds only TX-48 and TX-72, defers TX-184, and removes the tool at run end.
- Deny and replay paths passed on the deployed site; authority remained at four tools after denial and reset returned to idle.
- The deployed page produced no browser warnings or errors during the full correctness matrix.

## Risks / open items

- WebMCP remains a preview API and requires the appropriate browser support or testing flag. The app degrades visibly and safely if unavailable.
- Automated browser control could not load the local server because its localhost client is blocked in this environment. The local server itself returned HTTP 200; repeat browser verification directly in the user’s Chrome/ChatGPT environment.
- Native Chrome verification passed end to end on 2026-09-03 with Google’s Model Context Tool Inspector: four safe tools were discovered, safe tools returned expected results, the authority request changed the page, approval dynamically exposed `refund_scoped_transactions`, an out-of-scope call returned `SCOPE_VIOLATION`, the adjusted $72 grant refunded two transactions and deferred one, and ending the run removed the temporary tool.
- Anonymous Git access passed with credential helpers disabled: `git ls-remote https://github.com/emmaGH1/sloth.git HEAD` resolved the current public `main` state.
- The capability request rejects unsupported capabilities, blank reasons, duplicate/unverified transaction IDs, and invalid limits before opening the authority UI.
- The authority UI renders from the validated request payload; approval snapshots that payload into an active grant used by both the native tool description and enforcement function.
- `retry_payment` now returns `PREAUTHORIZED_POLICY_VIOLATION` for arbitrary IDs and reports its failed-payments-only, one-attempt, idempotent policy on success.
- WebMCP tool annotations now distinguish read-only inspection, policy-constrained mutation, authority request, and consequential refund execution.
- Sites version 4 was built, packaged, saved from the pushed Checkpoint 11 source, and deployed successfully under the existing owner-only access policy.
- The Sites access policy is now `public`; an unauthenticated HTTP check returned `200`, the Sloth page title, and page content.
- Preliminary brand review found the `Sloth` name already in use across software, AI, and finance products. The supplied running-sloth image was derived from a Pinterest reference and is rejected for the submission because its provenance and reuse rights are unclear. Keep the existing “S” mark and do not claim trademark exclusivity.
- Native Chrome verification predates Checkpoint 11. Repeat the 4 → 5 → 4 Inspector path after the next Sites deployment, including one allowed retry (`PAY-17`) and one blocked retry (`TX-48`).

## NEXT ACTION

Repeat the native 4 → 5 → 4 path on the public version, including one allowed retry (`PAY-17`) and one blocked retry (`TX-48`). Next product batch: make the investigation state truthful and drive the full judge path from natural-language agent calls rather than the deterministic replay.
