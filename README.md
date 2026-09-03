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

1. Select **Start delegated run**.
2. Wait for the confirmed duplicate-charge request.
3. Select **Allow this scope** (or reduce the cap with **Adjust**).
4. Notice `refund_scoped_transactions` enter the Authority rail.
5. Select **Test an out-of-scope call** to surface the machine-readable enforcement error.
6. Select **Execute verified refunds**.
7. Select **End run & revoke authority** and watch the capability disappear.

The in-console simulation is intentional: it preserves the demo story even when a browser does not expose the experimental WebMCP API. Native compatibility is reported in the header. The project is packaged for ChatGPT Sites hosting.
