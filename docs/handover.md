# Sloth handover

## Status

**Checkpoint 6 — correctness pass validated.** Sloth is live at `https://sloth-webmcp.theboyemma.chatgpt.site`; the next private version closes the scope-enforcement and adjusted-grant defects found during live QA.

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
- `npm test` now passes 8 focused scope/planning tests; the Sites production build succeeds.
- Live QA found and corrected a browser compatibility issue in the adjustment slider by binding the direct input event; the displayed and granted cap now follows pointer/keyboard changes.

## Risks / open items

- Native browser testing remains required: WebMCP is a preview API and may require an enabled flag, origin trial, or browser extension. The app degrades visibly and safely if unavailable.
- Automated browser control could not load the local server because its localhost client is blocked in this environment. The local server itself returned HTTP 200; repeat browser verification directly in the user’s Chrome/ChatGPT environment.
- Hosted native WebMCP verification in the user’s enabled Chrome remains pending; the ChatGPT in-app browser reports `Visual fallback active`.

## NEXT ACTION

Publish this correctness checkpoint privately, then run the deployed approve, adjusted-cap, deny, replay, and revoke paths. After that, verify native tool discovery and removal in the user’s WebMCP-enabled Chrome.
