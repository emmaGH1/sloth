# Sloth PRD-lite

**Status:** Locked product contract for the WebMCP Challenge  
**Working name:** Sloth  
**Core line:** **Delegate outcomes, not unlimited access.**

## Product objective

Demonstrate a safer human-agent operating model for consequential work. A person delegates an outcome; the agent begins with low-risk capabilities, investigates independently, and asks for narrowly scoped authority only when it reaches a real boundary. The human may approve, adjust, or deny the request. Any granted capability is enforced inside the tool and disappears when the task ends.

Sloth is a deterministic payment-operations sandbox and capability-policy prototype. It is not a production payment processor and moves no real funds.

## User and job

**Primary user:** A payment-operations lead responsible for resolving daily exceptions without granting an agent permanent financial authority.

**Job to be done:** “Clean up today’s payment problems. Only bother me when you actually need my authority.”

**Current failure mode:** Agents are commonly given broad standing access or forced to request approval for every step. The first is unsafe; the second destroys useful autonomy.

## Why WebMCP

WebMCP makes the browser page’s live tool inventory an authorization boundary. Sloth can expose safe inspection capabilities immediately, omit refund authority entirely, register one scoped refund tool after human approval, and remove it through the registration lifecycle when the run ends. Without dynamic WebMCP tools, the central product interaction becomes only a visual permission prompt rather than a real change in agent capability.

## One judge path

1. The agent receives the human’s outcome, not a sequence of instructions.
2. Four initial tools are discoverable; no refund tool exists.
3. The agent inspects issues and transactions and performs only policy-pre-authorized retries.
4. It confirms three duplicate charges and calls `request_capability` with the exact transaction IDs, maximum amount, and reason.
5. The human adjusts the maximum from $184 to $72 and approves.
6. `refund_scoped_transactions` appears dynamically with the approved scope.
7. A broader call is rejected with a structured `SCOPE_VIOLATION`.
8. The agent adapts, refunding TX-48 and TX-72 while leaving TX-184 untouched.
9. The task ends; the temporary tool is removed and the authority rail returns from five tools to four.

## Tool contract

| Tool | Availability | Contract |
| --- | --- | --- |
| `inspect_issues` | Always | Read-only summary of current sandbox issues. |
| `inspect_transaction` | Always | Read-only lookup of one known transaction ID. |
| `retry_payment` | Always under pre-authorized policy | Mutating but constrained: failed transactions only, existing customer authorization, idempotent execution, and bounded retry count. It must not be described as inherently safe. |
| `request_capability` | Always | Requests a supported capability with `scope.transactions`, `scope.maxAmount`, and `reason`. The authorization UI must render from this payload. |
| `refund_scoped_transactions` | Approved run only | Accepts refund instructions, validates every ID and amount against an immutable approved grant, returns structured violations, and is unregistered at task completion. |

All schemas reject unexpected properties and use precise bounds. Inspection tools declare `readOnlyHint: true`; mutating tools do not. Tool results are structured for agent recovery, and visible UI state mirrors native calls.

## Experience contract

- **Initial:** Show unresolved work and four available capabilities; do not reveal completed investigation results.
- **Investigating:** Reveal findings only as agent tools execute and record each decision in the activity log.
- **Boundary:** Present the agent-proposed scope with clear Allow, Adjust, and Deny actions.
- **Granted:** Make the fifth tool’s appearance and exact scope visually unmistakable.
- **Rejected:** Show that the tool—not merely the interface—blocked the call, then show the agent adapting.
- **Complete:** Remove the capability visibly and confirm the authority count returns to four.
- **Fallback:** If native WebMCP is absent, label the deterministic replay clearly. When WebMCP is ready, native agent activity is the primary path.
- **Recovery:** Provide a reliable reset from every terminal state.

## Visual direction

**Industrial control-room minimalism:** black and warm off-white surfaces, acid-lime authority signals, editorial scale, crisp borders, technical monospace metadata, and restrained motion. Visual impact comes from capability transitions—request, insertion, rejection, adaptation, and revocation—not decorative effects. The recording layout must fit beside a WebMCP agent/Inspector panel without awkward scrolling.

## Success criteria

- Native discovery shows exactly four tools before approval, five during the grant, and four after completion or denial.
- The capability request supplies the scope displayed to the human; no hidden hard-coded scope completes the claim.
- Adjusted authority changes the registered tool’s enforced boundary.
- An out-of-scope call returns one machine-readable rejection with actionable violations.
- A natural-language agent completes the full path and adapts after rejection.
- The deterministic fallback reproduces the story without being confused for native agent execution.
- Tests cover validation, planning, request-to-grant derivation, and the 4 → 5 → 4 registration lifecycle.
- A logged-out judge can access the live app and public repository.

## Non-goals

- Real payments, customer data, authentication, persistence, billing, or background jobs.
- Multiple operations workflows or a generalized policy editor.
- Production claims, compliance claims, or claims that the sandbox executes real financial actions.
- A broad redesign that risks the verified judge path.

## Impact framing

Payment refunds are the concrete proof. The reusable interaction model applies wherever an agent may need temporary consequential authority: infrastructure changes, procurement, account deletion, healthcare operations, and other high-impact workflows. Sloth’s claim is not that every policy is solved; it is that authority can become narrow, inspectable, adjustable, enforceable, and temporary at the moment an agent needs it.

## Brand status

"Sloth" remains the hackathon working name. The proposed running-sloth wordmark was derived from a Pinterest reference and is **rejected for this submission** because its provenance and reuse rights are not clear. Keep the current simple in-product “S” mark for the challenge. The name is already used by multiple software, AI, and finance products, so do not claim trademark exclusivity; revisit naming and formal clearance only after the hackathon.

## Submission gate

Before recording or submission: add an open-source license, make the repository and live app judge-accessible, verify native WebMCP in Chrome and ChatGPT’s in-app browser, publish a narrated video under three minutes, complete the Devpost description and testing instructions, tag the deployed commit, and freeze all submitted materials at the deadline.
