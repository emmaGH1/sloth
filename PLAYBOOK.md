# Sloth — WebMCP Challenge submission playbook

**Status:** Final proof, video and submission phase  
**Owner:** Emma  
**Product line:** **Delegate outcomes, not unlimited access.**  
**Official deadline:** September 4, 2026 at 1:00 AM PT / **9:00 AM WAT**  
**Internal freeze:** **8:15 AM WAT**  
**Current release candidate:** current local `main` (not yet pushed or deployed)

Official sources: [OpenAI challenge page](https://openai.com/webmcp-challenge/) · [Devpost rules](https://webmcp.devpost.com/rules) · [deadline extension](https://webmcp.devpost.com/updates/46227-deadline-extension-12-more-hours)

---

## 1. The win thesis

Sloth should not be presented as a fictional refund dashboard. It is a **capability-policy prototype for consequential agent work**.

The one-sentence hook:

> AI agents should not carry permanent refund authority. Sloth creates one narrow tool only when the agent reaches a real boundary, enforces the human-adjusted scope inside that tool, and removes it after one compliant batch.

The memorable proof:

```text
04 baseline tools
      ↓ agent reaches a real boundary
human adjusts $184 / $304 → $72 / $150
      ↓ native registration succeeds
05 tools
      ↓ overreach is rejected; agent adapts
04 tools
```

If a judge remembers only one idea, it must be:

> **Authority is a temporary tool surface, not a permanent API key.**

---

## 2. Why this is a strong WebMCP entry

### Differentiation

Sloth is not “an AI agent that manages payments.” The differentiator is the authority lifecycle:

```text
absent → requested → human-adjusted → registered → enforced → consumed → removed
```

Avoid “first,” “only” or “never possible before” claims. The credible novelty claim is:

> Sloth turns dynamic WebMCP registration into a visible, human-adjustable least-privilege interaction model.

### WebMCP centrality test

Remove WebMCP and the project loses its core claim:

- the refund action can no longer be absent from the agent’s tool inventory;
- human approval no longer changes the agent’s real capability surface;
- `04 → 05 → 04` becomes cosmetic UI state rather than runtime authority;
- automatic removal cannot be proven through tool discovery.

**Verdict:** WebMCP is load-bearing, not a wrapper.

### Sixty-second demoability

Within sixty seconds a judge can see:

1. four baseline tools and no refund authority;
2. the agent investigate and request a precise scope;
3. the human reduce that scope;
4. a fifth tool appear only after registration.

The rejection, adaptation and removal complete the proof in the next sixty seconds.

---

## 3. Official rubric strategy

The four Devpost criteria are equally weighted.

| Criterion | Sloth’s strongest evidence | Remaining risk | Video/description response |
| --- | --- | --- | --- |
| **WebMCP Leverage** | Dynamic tool registration, structured enforcement and automatic removal are the product. | Latest production `04 → 05 → 04` path is not yet reverified. | Show the tool inventory before, during and after the grant. |
| **Execution** | Coherent console, human adjustment, error recovery, TTL, denial, reset and audit export. | A registration failure or accidental simulation would damage trust. | Header must say `Native Live`; show `04` until registration succeeds. |
| **Potential Impact** | Least-privilege authority applies to refunds, infrastructure, procurement, account deletion and healthcare operations. | A payment sandbox can look narrow or synthetic. | Say “refunds are the specimen; temporary authority is the reusable primitive.” |
| **Creativity & Ambition** | The human edits an agent-proposed capability and the browser’s actual tool surface changes. | Dynamic registration alone is part of WebMCP, not a unique invention. | Emphasize the full negotiation lifecycle and agent adaptation, not registration alone. |

### Current judge score before final proof

| Criterion | Working score | Release gate to improve it |
| --- | ---: | --- |
| WebMCP Leverage | 9.0 / 10 | Native production verification captured on video. |
| Execution | 7.5 / 10 | Public release matches source; flawless agent run; no contradictory UI state. |
| Potential Impact | 7.5 / 10 | One concise generalization beyond refunds in description and close. |
| Creativity & Ambition | 8.5 / 10 | Frame “authority as a tool surface” clearly and early. |

**Target after recording:** 8.5+ overall.

---

## 4. The proof primitive: Authority Lifecycle Receipt

Sloth’s exported audit JSON is the project’s proof artifact. Name it consistently:

> **Authority Lifecycle Receipt** — a structured record of the operator intent, revealed findings, agent-requested scope, human-adjusted grant, runtime tool count, execution result and decision log.

The receipt proves what the browser session reports. It is **not** cryptographically signed, remotely persisted or an independent payment receipt.

### Receipt fields that matter in the demo

- `operatorIntent`
- `investigationFindings`
- `capabilityRequest`
- `humanGovernance.status`
- `humanGovernance.unitCapApproved`
- `humanGovernance.aggregateCapEnforced`
- `runtimeLifecycle.initialToolCount`
- `runtimeLifecycle.activeToolCount`
- `runtimeLifecycle.currentPhase`
- `executionReceipts`
- `eventLog`

### Receipt narration

Use one sentence only:

> The page can export an Authority Lifecycle Receipt showing what the agent discovered, what it asked for, what the human allowed, what the tool enforced and when the authority disappeared.

Do not turn receipt export into the video climax. The climax is the fifth tool disappearing.

---

## 5. Honesty matrix

| Layer | What is live and functional | What is staged or simulated | Evidence |
| --- | --- | --- | --- |
| **Native WebMCP** | Four baseline tools register in supported browsers; approval dynamically registers one scoped refund tool; abort removes it. | Standard browsers receive a clearly labelled deterministic simulation. | `app/page.tsx`, native Inspector/ChatGPT run. |
| **Scope enforcement** | Transaction IDs, per-item cap, aggregate cap, original transaction value and duplicate IDs are checked inside the tool logic. | Sandbox transaction records are fixed fixtures. | `scope.js`, 22 passing tests. |
| **Human governance** | Agent payload drives the card; the user can allow, adjust or deny; registration failure stays at rail 04. | No identity, roles, multi-user approval or persistent policy store. | `app/page.tsx`. |
| **Agent behavior** | A live ChatGPT/WebMCP agent can inspect, request, encounter `SCOPE_VIOLATION` and adapt. | The fallback replay is deterministic and is not native-agent proof. | Public native video plus labelled fallback. |
| **Payment execution** | Policy validation and state transitions are functional in the browser sandbox. | No payment processor, real funds, customer accounts or settlement. | README disclaimer, `scope.js`. |
| **Authority Lifecycle Receipt** | JSON export records intent, findings, request, grant, result, lifecycle and event log. | Not signed, hashed, remotely stored or independently attested. | Export from the operations console. |
| **Deployment** | Public Vercel URL and public MIT-licensed GitHub repository. | No production SLA, authentication or backend persistence. | Live URL, repository and license. |

This table should be copied into the Devpost description if space permits. It may be shortened, but its distinctions must not be softened.

---

## 6. Verify it yourself in under 60 seconds

No dependency installation is required for the deterministic policy verifier if Node.js 22.13+ is already present:

```powershell
node --test tests/scope.test.mjs
```

Expected result:

```text
tests 22
pass 22
fail 0
duration < 1 second on the development machine
```

What it verifies:

- capability-request validation;
- request-to-grant derivation;
- per-item and aggregate scope enforcement;
- structured rejection of unapproved or excessive refunds;
- bounded retry policy behavior;
- findings revealed only by matching calls;
- grant consumption only after an in-scope success.

What it does **not** verify:

- browser-native registration and removal;
- ChatGPT agent planning;
- Vercel availability;
- payment settlement.

Those are proven separately by the native video and live judge path.

---

## 7. Final-clock execution plan

Checkpoint time for this plan: approximately **4:52 AM WAT**. Deadline: **9:00 AM WAT**.

| WAT | Task | Hard acceptance gate |
| --- | --- | --- |
| **Now–5:10** | Obtain approval, push current local `main`, wait for Vercel and confirm production contains the new S mark and lifecycle hero. | Public source and deployed UI match the release candidate. |
| **5:10–5:40** | Run native ChatGPT or Inspector path twice. | Both runs complete `04 → 05 → 04`; one structured violation; one valid batch; no stale Live/TTL state. |
| **5:40–6:00** | Freeze narration and shot order. | Script is under 330 spoken words and the live action begins within 15 seconds. |
| **6:00–6:40** | Record primary and one backup take. | Clear audio, no copyrighted music, native header visible, under 3 minutes. |
| **6:40–7:10** | Upload publicly to YouTube; wait for processing. | Public logged-out playback works at readable resolution. |
| **7:10–7:50** | Complete Devpost description, testing instructions, repo, live link and video. | Every required field is populated and saved. |
| **7:50–8:15** | Logged-out release audit and submit. | Live URL, repo, license and video work without authentication; submission says Submitted, not Draft. |
| **8:15–9:00** | Frozen contingency buffer. | No changes unless submission access is broken. |

If the schedule slips, cut architecture narration and receipt export before cutting the native rejection/adaptation/removal proof.

---

## 8. Native release gate

Do not record until every item passes twice on the public URL:

- [ ] Header says **WebMCP / Native Live**.
- [ ] Exactly four baseline tools exist.
- [ ] Investigation counts are masked before matching tool calls.
- [ ] Native calls update the visible findings and decision log.
- [ ] The capability card reflects the agent payload: three IDs, $184 item cap, $304 aggregate cap.
- [ ] Human adjustment changes the proposed scope to $72 / $150.
- [ ] Rail remains 04 while registration is pending.
- [ ] The fifth tool exists before the rail changes to 05.
- [ ] TX-999 / $220 returns one `SCOPE_VIOLATION` and leaves the tool registered.
- [ ] One batch containing TX-48 / $48 and TX-72 / $72 succeeds.
- [ ] TX-184 remains untouched.
- [ ] The refund tool disappears automatically.
- [ ] Rail returns to 04.
- [ ] Completion says consumed and removed; no live TTL remains.
- [ ] Reset returns to a clean four-tool state.

If a gate fails, fix only that failure. Do not add features or redesign.

---

## 9. Demo video script and shot list

Target length: **2:10–2:35**. Absolute maximum: **2:59**.

### 0:00–0:15 — Hook and immediate proof

**Screen:** Public console beside ChatGPT/Inspector. Rail 04 and four tools visible.

**Narration:**

> AI agents are usually given permanent access or interrupted for every action. Sloth offers a third model: delegate the outcome, then create narrow authority only when the agent actually needs it.

Immediately send:

```text
Clean up today’s payment problems. Only bother me when you actually need my authority.
```

### 0:15–0:45 — Autonomous investigation

Show native tool calls unmasking the counts and the bounded retry.

**Narration:**

> The agent starts with four low-risk tools. It can inspect issues and retry only pre-authorized failures, but it has no refund capability at all.

### 0:45–1:10 — Human-adjusted boundary

Show the authority request sourced from the agent payload. Adjust $184 / $304 to $72 / $150.

**Narration:**

> When it confirms duplicate charges, the agent asks for exact transaction IDs and limits. I can allow, deny or narrow the request. I reduce both the per-item and total exposure.

Hold on rail 04 while registration is pending, then show rail 05 and the new tool.

### 1:10–1:35 — Enforced rejection and adaptation

Show TX-999 / $220 returning `SCOPE_VIOLATION` while rail remains 05.

**Narration:**

> The boundary lives inside the tool, not only in the interface. This broader call is rejected with a structured error, so the agent can recover instead of pretending it succeeded.

### 1:35–1:55 — Completion and revocation

Show one valid batch for TX-48 and TX-72. Hold on the fifth tool disappearing and rail returning to 04.

**Narration:**

> The agent adapts, submits one compliant batch and leaves TX-184 untouched. The single-use capability is consumed and removed automatically. Authority returns to baseline.

### 1:55–2:20 — Architecture and close

Briefly show the tool handler or 04 → 05 → 04 diagram. Optionally flash the Authority Lifecycle Receipt.

**Narration:**

> WebMCP is the authorization layer: approval changes the browser’s actual tool inventory. Refunds are the specimen, but the same pattern applies to infrastructure changes, procurement, account deletion and other consequential agent actions. Delegate outcomes—not unlimited access.

Do not include a long title card, setup, sign-in, source-code tour, Fast-forward climax or simulated replay.

---

## 10. Devpost description blueprint

### Opening

> Sloth is a payment-operations sandbox for just-in-time agent authority. A human delegates an outcome; the agent investigates independently, requests a precise temporary capability only at a real boundary, adapts when the tool rejects an overreach, and loses that capability after one compliant batch.

### Why WebMCP

> WebMCP makes the browser’s live tool inventory the authorization boundary. Four baseline tools exist at the start. Human approval dynamically registers a fifth refund tool derived from the agent’s requested scope. The tool enforces the human-adjusted transaction IDs and limits internally, returns structured violations, and unregisters itself after success.

### Human-agent experience

> The human does not micromanage investigation and does not grant permanent financial access. They intervene once, at the moment consequential authority is needed, with Allow, Adjust and Deny controls.

### Impact

> Refunds make the model concrete. The same authority lifecycle can govern infrastructure changes, procurement, account deletion, healthcare operations and other high-impact actions where permanent agent access is dangerous.

### Honest scope

> Sloth is a deterministic capability-policy prototype. It uses sandbox payment records and moves no real funds. Its live proof is dynamic WebMCP discovery, registration, enforcement, structured recovery and removal.

---

## 11. Submission asset checklist

- [x] Public repository with MIT license.
- [x] README explains why WebMCP is load-bearing.
- [x] Exact native and Inspector evaluation paths.
- [x] Provenance-safe S mark and original capability-lifecycle visual.
- [x] 22 deterministic policy tests.
- [x] Production build passes.
- [ ] Release candidate pushed to GitHub main.
- [ ] Vercel deployed from the release candidate.
- [ ] Native public flow passes twice.
- [ ] Authority Lifecycle Receipt exported from the final run.
- [ ] Video recorded under three minutes with audio.
- [ ] Video publicly available on YouTube.
- [ ] Demo link added near the top of README after upload.
- [ ] Devpost description and testing instructions complete.
- [ ] Live URL, repository and video tested while logged out.
- [ ] Submission marked **Submitted**.
- [ ] Final commit/tag recorded in `docs/handover.md`.

---

## 12. Risk register

| Risk | Severity | Prevention | Recovery |
| --- | --- | --- | --- |
| Latest native path fails after deployment | Critical | Run twice before recording. | Fix only the failing state; rerun tests/build; redeploy. |
| Agent submits refunds one at a time | High | Tool description and request response require one batch. | Restart and use Inspector for the recorded native path if necessary. |
| UI shows 05 before tool registration | High | Rail is tied to confirmed registration state. | Stop recording; investigate registration failure. |
| Completion still implies live authority | High | Completed state removes grant strip and TTL. | Stop recording; do not explain around it. |
| Video upload processing delays submission | High | Upload by 6:40 WAT and keep a backup take. | Use the first processed compliant take. |
| Devpost outage or congestion | High | Submit by 8:15 WAT. | Use the final 45-minute buffer only for access issues. |
| Artwork provenance/IP issue | Medium | Rejected running-sloth assets removed; use S mark and lifecycle diagram. | Do not reintroduce the old assets. |
| Sandbox mistaken for production payments | Medium | Repeat the honesty statement in README and description. | Never claim settlement, customers or production readiness. |
| Post-deadline edit jeopardizes eligibility | Critical | Freeze repo, site, video and submission at deadline. | Continue only in a separate fork after judging begins. |

---

## 13. Rejected ideas and scope guardrail

Do not add before submission:

- real payment integrations;
- authentication or multi-user roles;
- databases or durable policy storage;
- multiple operations workflows;
- a generalized policy editor;
- cryptographic or externally attested receipts;
- new landing-page sections;
- broad visual redesign;
- extra tool types;
- more demo branches;
- speculative sponsor integrations.

These may be valid post-hackathon work, but they do not improve the direct judge proof enough to justify release risk.

---

## 14. Final freeze rule

After submission closes, do not modify the submitted repository, live deployment, video or Devpost entry during judging unless the organizers explicitly permit a correction.

Keep the submitted project accessible through the judging period. Any post-hackathon development must happen in a separate branch or fork that does not change the submitted materials.

## NEXT ACTION

Obtain explicit approval to push current local `main` to GitHub, confirm the Vercel deployment, then execute the native release gate twice before recording.
