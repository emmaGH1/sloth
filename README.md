# Sloth

**Delegate outcomes, not unlimited access.**

Sloth is a demo-first payment-operations console that shows an AI agent requesting only the authority it needs. It uses the browser WebMCP API when it is available:

1. Four baseline tools are registered on load: two read-only tools, one tightly pre-authorized retry mutation, and one authority-request tool.
2. `request_capability` must provide the exact transaction IDs, maximum amount, and reason shown to the human. `refund_scoped_transactions` does not exist until that request is approved.
3. The refund tool enforces the approved transaction IDs and per-transaction limit, returning a structured `SCOPE_VIOLATION` error for anything else.
4. Ending the run aborts the registration, removing the refund tool from the browser’s exposed surface.

`retry_payment` is not presented as inherently safe: it accepts only failed payment IDs returned by the current inspection, is limited to one idempotent attempt, and returns `PREAUTHORIZED_POLICY_VIOLATION` for arbitrary IDs.

## Run locally

Install the locked dependencies and start the Sites development server, then open the printed local URL in a WebMCP-enabled browser:

```powershell
npm ci
npm run dev
```

Create the production bundle with `npm run build`.

## Judge path

Native WebMCP is the primary proof. In Chrome with WebMCP enabled, or in ChatGPT’s in-app browser, the agent should:

1. Discover the four baseline tools. `refund_scoped_transactions` must be absent.
2. Call `inspect_issues`, `inspect_transaction`, and `retry_payment`. Investigation counts appear only after those calls.
3. Call `request_capability` with the verified transaction IDs, maximum amount, and reason.
4. Select **Allow this scope** (or reduce the cap with **Adjust**).
5. Notice `refund_scoped_transactions` enter the Authority rail.
6. An out-of-scope refund returns a machine-readable `SCOPE_VIOLATION`.
7. In-scope refunds complete; **End run & revoke authority** removes the fifth tool.

If native WebMCP is unavailable, the header shows **Demo replay mode**. **Start delegated run** then replays the labelled fallback path. The in-console simulation must not be confused for native agent execution. The project is packaged for ChatGPT Sites hosting.
