# Sloth guardrails

## The demo promise

> Delegate outcomes, not unlimited access.

The human asks Sloth to clean up payment issues. Sloth investigates with safe tools, then asks for exactly the authority it needs. The user stays in control without becoming a bottleneck.

## Non-negotiable capability rules

1. `refund_transaction` is absent before a grant and after a run ends.
2. A grant names specific transaction IDs, a per-transaction amount limit, and an aggregate amount limit.
3. The refund tool checks those constraints (including spend from earlier calls) and returns structured errors for violations.
4. A rejected action causes the agent to adapt instead of pretending it succeeded.
5. The activity feed must make the authority change legible to a judge.
6. `retry_payment` is a mutation, not a read-only tool. It must enforce the inspected-failure allowlist, one-attempt limit, and idempotent behavior as pre-authorized policy.
7. The capability-request payload is the only source of truth for the scope shown to the human and later enforced by the refund tool.

## Scope cuts

- No real payments or customer data.
- No authentication, persistence, multi-user logic, billing, or background jobs.
- No generalized policy editor. The adjustment surface is deliberately constrained to the pending request.
- No extra workflows until the complete refund story is polished and tested.

## Demo recovery

If native WebMCP is not available in the judge browser, the console’s built-in agent simulation remains the primary visual proof. The app must still show the live tool inventory and structured scope errors.
