<p align="center">
  <img src="./public/favicon.svg" alt="Sloth S logo" width="88" height="88" />
</p>

<h1 align="center">Sloth</h1>

<p align="center"><strong>Delegate outcomes, not unlimited access.</strong></p>

<p align="center">
  <a href="./LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="MIT License" /></a>
  <a href="https://webmcp.devpost.com/"><img src="https://img.shields.io/badge/WebMCP-Native-d7fc62.svg" alt="Native WebMCP" /></a>
  <a href="https://sloth-webmcp.vercel.app"><img src="https://img.shields.io/badge/Live-sloth--webmcp.vercel.app-black.svg" alt="Live app" /></a>
</p>

Sloth is a payment-operations sandbox that demonstrates a safer human-agent operating model for consequential work. A person delegates an outcome. The agent investigates with low-risk tools, asks for narrowly scoped authority only when it reaches a real boundary, adapts when the tool rejects an overreach, and loses the capability after the approved work is complete.

- **Live app:** https://sloth-webmcp.vercel.app
- **Source:** https://github.com/emmaGH1/sloth
- **License:** MIT

Final submission execution, proof claims and freeze rules are tracked in [PLAYBOOK.md](./PLAYBOOK.md).

Sloth is a capability-policy prototype, not a production payment processor. It moves no real funds and contains no authentication, customer data or payment-provider integration. “Sloth” is a hackathon working name.

## The problem

Agents are commonly given either broad standing access or an approval prompt for every action. The first is unsafe; the second destroys useful autonomy.

Sloth demonstrates a third option: **authority appears only when needed, is constrained by the human-approved request, is enforced inside the tool, and is removed automatically.**

```text
human intent
    ↓
04 baseline tools — inspect and perform bounded recovery
    ↓
agent requests an exact refund scope
    ↓
human allows, adjusts or denies
    ↓
05 tools — one scoped, single-use refund capability
    ↓
tool rejects overreach → agent adapts → valid batch succeeds
    ↓
04 tools — temporary capability consumed and removed
```

## Why WebMCP is essential

The browser’s live tool inventory is the authorization boundary—not a decorative permission card.

- `refund_scoped_transactions` does not exist before human approval.
- The approval card is rendered from the agent’s `request_capability` payload.
- The approved transaction IDs, per-item limit and aggregate limit are enforced inside the registered tool.
- Out-of-scope calls return a machine-readable `SCOPE_VIOLATION`; the tool remains available so the agent can recover.
- The first successful in-scope batch consumes the grant and unregisters the fifth tool.
- Registration failure never produces a false `05`: the rail stays at `04` until native registration succeeds.

Without dynamic WebMCP registration and removal, this would only be a visual approval flow. With WebMCP, the agent’s actual capability surface changes.

## Evaluate the native agent path

The header must read **`WebMCP / Native Live`**. If it says **Simulation**, native tools are unavailable in that browser; stop and switch.

Use Chrome 149+ with `chrome://flags/#enable-webmcp-testing` enabled and Chrome relaunched, or ChatGPT’s in-app browser. The optional [Model Context Tool Inspector](https://chromewebstore.google.com/detail/model-context-tool-inspec/gbpdfapgefenggkahomfgkhfehlcenpd) can be used for manual verification.

Open https://sloth-webmcp.vercel.app. The authority rail should show **04**, investigation counts should show **—**, and `refund_scoped_transactions` should not exist.

### ChatGPT

Give the agent one outcome, not a tool script:

```text
Clean up today’s payment problems. Only bother me when you actually need my authority.
```

Expected flow:

1. The agent uses the baseline tools and the investigation counts unmask as calls occur.
2. It requests refund authority for TX-48, TX-72 and TX-184. Refunds are still impossible.
3. Click **Adjust**. Set the per-item cap to **$72** and aggregate cap to **$150**, then click **Confirm revised grant**.
4. The rail remains **04** while registration is pending and becomes **05** only when the fifth tool exists.
5. An attempted TX-999 / $220 refund returns `SCOPE_VIOLATION`; the rail stays **05**.
6. The agent adapts and sends TX-48 / $48 and TX-72 / $72 together in one valid batch, leaving TX-184 untouched.
7. The single-use tool is consumed and removed. The rail returns to **04**, with no live grant or TTL remaining.

### Inspector

Use the same path while invoking tools manually:

1. Confirm exactly four tools and no `refund_scoped_transactions`.
2. Call `inspect_issues` → counts become **14 / 03**.
3. Call `inspect_transaction` for TX-48, TX-72 and TX-184.
4. Call `retry_payment` with `{ "id": "PAY-17" }` → success.
5. Call `retry_payment` with `{ "id": "TX-48" }` → `PREAUTHORIZED_POLICY_VIOLATION`.
6. Request authority:

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

The card must show **$184 per item** and **$304 aggregate** while the rail remains **04**. Adjust it to **$72 per item** and **$150 aggregate**, then confirm. The fifth tool appears and the rail becomes **05**.

7. Call the refund tool outside the approved scope:

```json
{
  "transactions": [{ "id": "TX-999", "amount": 220 }]
}
```

Expect `SCOPE_VIOLATION`; the fifth tool must remain registered.

8. Submit one valid, single-use batch:

```json
{
  "transactions": [
    { "id": "TX-48", "amount": 48 },
    { "id": "TX-72", "amount": 72 }
  ]
}
```

Both refunds succeed, TX-184 remains untouched, the refund tool disappears, and the rail returns to **04**.

## Pass criteria

| Beat | Pass condition |
| --- | --- |
| Initial state | Exactly four tools; no refund capability; investigation counts remain masked until matching calls occur. |
| Boundary request | The human card reflects the agent-supplied IDs and limits, not hidden defaults. |
| Human adjustment | The registered tool enforces $72 per item and $150 aggregate rather than the original $184 / $304 request. |
| Overreach | One structured `SCOPE_VIOLATION`; authority remains at 05 so the agent can adapt. |
| Completion | One batch refunds TX-48 and TX-72, leaves TX-184 untouched, removes the tool and returns the rail to 04. |

Denial and TTL expiry are supported safety paths, but they are not part of the recorded judge flow. A denied agent receives `DO_NOT_RETRY` on later authority requests.

## Tool surface

| Tool | Availability | Contract |
| --- | --- | --- |
| `inspect_issues` | Baseline | Read-only issue summary. |
| `inspect_transaction` | Baseline | Read-only lookup by transaction ID. |
| `retry_payment` | Baseline, policy-constrained | Retries only sandbox failures on the pre-authorized allowlist; it cannot issue refunds. |
| `request_capability` | Baseline | Requests exact transaction IDs, per-item cap, aggregate cap and reason. Its payload drives the human approval card. |
| `refund_scoped_transactions` | Human grant only | Single-use batch tool enforcing the immutable approved scope. Returns structured violations and is removed after success, run end or expiry; denial prevents registration. |

## Run locally

Requires Node.js 22.13 or newer.

```powershell
npm ci
npm test
npm run dev
```

Run `npm run build` to verify the production build.

## License

MIT. See [LICENSE](./LICENSE).
