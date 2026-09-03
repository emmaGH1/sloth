# Sloth handover

## Status

**Checkpoint 3 — implementation committed and published.** The repository was empty at intake. Sloth is the working name and the product wrapper is a fictional SaaS payment-operations console.

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

## Risks / open items

- Native browser testing remains required: WebMCP is a preview API and may require an enabled flag, origin trial, or browser extension. The app degrades visibly and safely if unavailable.
- Automated browser control could not load the local server because its localhost client is blocked in this environment. The local server itself returned HTTP 200; repeat browser verification directly in the user’s Chrome/ChatGPT environment.
- The GitHub remote reported `origin/main [gone]` on clone because the remote was empty; pushing will require network access and repository permissions.

## NEXT ACTION

Open the published project in the user’s WebMCP-enabled Chrome or ChatGPT Site Tools environment and run the README judge path. Inspect the tool inventory before/after approval and after revocation, then record exact native browser results here. If the preview API is unavailable, use the in-console fallback and preserve the scope-enforcement output in the demo recording.
