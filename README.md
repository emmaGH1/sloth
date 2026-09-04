# Sloth

> **Delegate outcomes, not unlimited access.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![WebMCP](https://img.shields.io/badge/WebMCP-Native-lime.svg)](https://webmcp.devpost.com/)
[![Live](https://img.shields.io/badge/Live-sloth--webmcp.vercel.app-black.svg)](https://sloth-webmcp.vercel.app)

A payment-operations sandbox for the [WebMCP Challenge](https://webmcp.devpost.com/). An agent starts with four baseline tools, investigates on its own, then asks for one temporary refund capability. You allow, adjust, or deny. Scope is enforced **inside the tool**. After an in-scope refund, the tool is gone.

Not a production processor. No real funds, auth, or customer data. “Sloth” is a working name only.

- App: https://sloth-webmcp.vercel.app
- Repo: https://github.com/emmaGH1/sloth (MIT)

## Evaluate (native WebMCP)

This submission is judged on a **live agent** talking to the page’s tools. Do **not** click **Launch Delegated Run**.

The header must read **`WebMCP / Native Live`**. If it says **Simulation**, native tools are not available in that browser — stop and switch.

**Setup.** Chrome 149+ with `chrome://flags/#enable-webmcp-testing` enabled (relaunch Chrome), or ChatGPT’s in-app browser. Optional: [Model Context Tool Inspector](https://chromewebstore.google.com/detail/model-context-tool-inspec/gbpdfapgefenggkahomfgkhfehlcenpd).

Open https://sloth-webmcp.vercel.app. Rail **04**. Counts are **—**. `refund_scoped_transactions` does not exist.

### ChatGPT

Paste only this, then watch the **page**:

```
Clean up today’s payment problems. Only bother me when you actually need my authority.
```

You should see counts unmask as the agent inspects, then an authority card. That card is the hard boundary: refunds are still impossible.

**Your turn.** Click **Adjust**. Set per-item **$72** and aggregate **$150**. Click **Confirm revised grant**.

Rail **05**. A fifth tool exists. TTL starts near **10:00**.

The agent should try something out of scope, get `SCOPE_VIOLATION` (rail stays **05**), then refund **TX-48 $48** and **TX-72 $72**, leaving **TX-184**. Rail returns **04**. The refund tool is consumed.

### Inspector

Same path; you drive the tools.

1. Confirm four tools. No `refund_scoped_transactions`.
2. `inspect_issues` → counts **14 / 03**.
3. `inspect_transaction` `{ "id": "TX-48" }` (then TX-72, TX-184 if you want).
4. `retry_payment` `{ "id": "PAY-17" }` succeeds. `{ "id": "TX-48" }` → `PREAUTHORIZED_POLICY_VIOLATION`.
5. `request_capability`:

```json
{
  "capability": "refund_scoped_transactions",
  "scope": {
    "transactions": ["TX-48", "TX-72", "TX-184"],
    "maxAmount": 184,
    "maxTotalAmount": 304
  },
  "reason": "Confirmed duplicate charges"
}
```

The card shows **$184 / item** and **$304 aggregate**. Rail still **04**.

6. **Adjust** to **$72** and **$150**, then **Confirm revised grant**. Fifth tool appears. Rail **05**.
7. `refund_scoped_transactions` with TX-999 / $220 → `SCOPE_VIOLATION`. Rail stays **05**.
8. `refund_scoped_transactions` with TX-48 $48 and TX-72 $72. Success consumes the grant. Rail **04**.

## What “good” looks like

| Beat | Pass |
| --- | --- |
| Before grant | Exactly four tools. No refund tool. Counts stay `—` until the matching call. |
| Request | Card numbers come from the agent payload, not a hidden default. |
| After adjust | Fifth tool exists. Enforced cap is $72 / $150, not $184 / $304. |
| Out of scope | One `SCOPE_VIOLATION`. Tool stays registered. |
| In scope | TX-48 and TX-72 refunded, TX-184 untouched. Tool unregistered. Rail 04. |

Deny is supported (`DO_NOT_RETRY` on later `request_capability`). It is not the recorded path.

## Tools

| Tool | When | Contract |
| --- | --- | --- |
| `inspect_issues` | Always | Read-only issue summary. |
| `inspect_transaction` | Always | Read-only lookup by ID. |
| `retry_payment` | Always, pre-authorized | Failed IDs only (`PAY-17` ok, `TX-48` blocked). |
| `request_capability` | Always | Payload is the approval-card source of truth. |
| `refund_scoped_transactions` | After human grant | IDs, per-item cap, aggregate cap (including prior spend). Else `SCOPE_VIOLATION`. Removed on in-scope success, deny, end, or TTL expiry. |

## Local

Node 22.13+.

```powershell
npm ci
npm test
npm run dev
```

## License

MIT. See [`LICENSE`](LICENSE).
