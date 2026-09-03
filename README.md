# Sloth

**Delegate outcomes, not unlimited access.**

A payment-operations sandbox for the [WebMCP Challenge](https://webmcp.devpost.com/). An agent starts with four baseline tools, investigates, then asks for one temporary refund capability. The human can allow, adjust, or deny. Scope is enforced **inside the tool**, then the tool is removed.

Not a production processor. No real funds, auth, or customer data. “Sloth” is a working name only.

## Live

- App: https://sloth-webmcp.vercel.app
- Repo: https://github.com/emmaGH1/sloth.git (MIT)
- Commit: `e5a974e`

## Tools

| Tool | When | Contract |
| --- | --- | --- |
| `inspect_issues` | Always | Read-only issue summary |
| `inspect_transaction` | Always | Read-only lookup by ID |
| `retry_payment` | Always, pre-authorized | Failed IDs only (`PAY-17` ok, `TX-48` → `PREAUTHORIZED_POLICY_VIOLATION`) |
| `request_capability` | Always | Payload is the approval-card source of truth |
| `refund_scoped_transactions` | After human grant | Immutable IDs + cap; else `SCOPE_VIOLATION`; unregistered on end |

Investigation counts stay `—` until the matching native call runs.

## Judge path

Chrome 149+ with `chrome://flags/#enable-webmcp-testing`, or ChatGPT’s in-app browser. Header must read **Native tools online**.

1. Confirm four tools. No refund tool. Rail `04`.
2. `inspect_issues` → counts `14` / `03`.
3. `retry_payment` `{ "id": "PAY-17" }` succeeds; `{ "id": "TX-48" }` is blocked.
4. `request_capability`:

```json
{
  "capability": "refund_scoped_transactions",
  "scope": { "transactions": ["TX-48", "TX-72", "TX-184"], "maxAmount": 184 },
  "reason": "Confirmed duplicate charges"
}
```

5. **Adjust** to `$72` and confirm. Fifth tool appears. Rail `05`.
6. Refund `{ "id": "TX-999", "amount": 220 }` → one `SCOPE_VIOLATION`.
7. Refund TX-48 `$48` and TX-72 `$72`. Leave TX-184 untouched.
8. **End run & revoke authority**. Tool count returns to four.

If WebMCP is missing, the header shows **Demo replay mode**. **Start delegated run** is labelled fallback, not native proof.

## Local

```powershell
npm ci
npm test
npm run dev
```

Node 22.13+. `npm run build` is the ChatGPT Sites / vinext bundle.

## License

MIT. Keep the in-product “S” mark; do not use the Pinterest-derived running-sloth image.
