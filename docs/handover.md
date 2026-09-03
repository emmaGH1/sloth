# Sloth handover

## Status

**Checkpoint 1 — project controls established.** The repository was empty at intake. Sloth is the working name and the product wrapper is a fictional SaaS payment-operations console.

## Locked decisions

- Core line: **Delegate outcomes, not unlimited access.**
- Demo path: intent → investigate safe issues → request narrowly scoped refund authority for three verified duplicates → human approves/adjusts/denies → dynamically expose the scoped tool → enforce scope with structured errors → agent adapts → revoke authority at completion.
- Optimize for one flawless judge path. No auth, real payments, database, or multi-user system.
- User reports both ChatGPT Site Tools/WebMCP and WebMCP-enabled Chrome are available for later verification.

## Current test state

- Repository cloned successfully from `https://github.com/emmaGH1/sloth.git`.
- Repository had no commits or files on `main`.
- No app or automated checks exist yet.

## Risks / open items

- The exact public WebMCP registration API and browser support must be confirmed against the supplied test environments before claiming native interoperability.
- The GitHub remote reported `origin/main [gone]` on clone because the remote was empty; pushing will require network access and repository permissions.

## NEXT ACTION

Scaffold the smallest polished client app and implement the full in-console capability-negotiation state machine before adding native WebMCP registration.
