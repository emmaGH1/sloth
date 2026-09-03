"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { applyInvestigationFinding, confirmedTransactions as transactions, createEmptyFindings, defaultCapabilityRequest, issueSummary, planRefunds, retryPayment, retryablePayments, validateCapabilityRequest, validateRefund } from "../scope.js";

type Phase = "idle" | "investigating" | "request" | "granted" | "completed" | "closed" | "denied" | "expired";
type ToolDefinition = {
  name: string;
  description: string;
  inputSchema?: Record<string, unknown>;
  annotations?: Record<string, boolean>;
  execute(input: Record<string, unknown>): Promise<string> | string;
};
type ModelContext = {
  registerTool(tool: ToolDefinition, options?: { signal?: AbortSignal }): Promise<unknown>;
};
type LogItem = { time: string; message: string };
type CapabilityRequest = { capability: string; scope: { transactions: string[]; maxAmount: number; maxTotalAmount?: number }; reason: string };
type Grant = CapabilityRequest["scope"];
type Findings = {
  issuesReviewed: number | null;
  duplicatesConfirmed: number | null;
  retriesResolved: number | null;
  inspectedDuplicateIds: string[];
  retriedIds: string[];
};

const baselineTools = [
  { name: "inspect_issues", label: "Read-only" },
  { name: "inspect_transaction", label: "Read-only" },
  { name: "retry_payment", label: "Pre-authorized" },
  { name: "request_capability", label: "Boundary request" }
];

function getModelContext(): ModelContext | undefined {
  const doc = document as Document & { modelContext?: ModelContext };
  const nav = navigator as Navigator & { modelContext?: ModelContext };
  return doc.modelContext || nav.modelContext;
}

function clock() {
  return new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }).format(new Date());
}

function padCount(value: number | null) {
  return value == null ? "—" : String(value).padStart(2, "0");
}

export default function Home() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [nativeStatus, setNativeStatus] = useState<"checking" | "ready" | "fallback">("checking");
  const [maxAmount, setMaxAmount] = useState(184);
  const [maxTotalAmount, setMaxTotalAmount] = useState(150);
  const [ttlSeconds, setTtlSeconds] = useState(60);
  const [adjusting, setAdjusting] = useState(false);
  const [grantActive, setGrantActive] = useState(false);
  const [pendingRequest, setPendingRequest] = useState<CapabilityRequest>(defaultCapabilityRequest);
  const [activeGrant, setActiveGrant] = useState<Grant | null>(null);
  const [toolResult, setToolResult] = useState<Record<string, unknown> | null>(null);
  const [logs, setLogs] = useState<LogItem[]>([{ time: "09:41:02", message: "Run is waiting for your intent." }]);
  const [findings, setFindings] = useState<Findings>(createEmptyFindings);
  const investigationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const addLog = useCallback((message: string) => {
    setLogs((current) => [...current, { time: clock(), message }]);
  }, []);

  const recordNativeFinding = useCallback((toolName: string, payload: object, message: string) => {
    setFindings((current) => applyInvestigationFinding(current, toolName, payload));
    setPhase((current) => current === "idle" ? "investigating" : current);
    addLog(message);
  }, [addLog]);

  useEffect(() => {
    const context = getModelContext();
    if (!context?.registerTool) {
      setNativeStatus("fallback");
      return;
    }

    const controller = new AbortController();
    const register = async () => {
      const tools: ToolDefinition[] = [
        {
          name: "inspect_issues",
          description: "Read today’s payment issue summary without making financial changes.",
          annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
          async execute() {
            recordNativeFinding("inspect_issues", issueSummary, "Native agent inspected today’s payment issues.");
            return JSON.stringify(issueSummary);
          }
        },
        {
          name: "inspect_transaction",
          description: "Read a named payment transaction without changing it.",
          annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
          inputSchema: { type: "object", properties: { id: { type: "string" } }, required: ["id"] },
          async execute(input) {
            const match = transactions.find((transaction: { id: string }) => transaction.id === input.id);
            if (match) recordNativeFinding("inspect_transaction", match, `Native agent inspected ${match.id}.`);
            else addLog(`Native agent looked up unknown transaction ${String(input.id)}.`);
            return JSON.stringify(match || { error: { code: "NOT_FOUND", id: input.id } });
          }
        },
        {
          name: "retry_payment",
          description: "Retry only a failed payment named by today’s inspection, under an idempotent one-attempt pre-authorization policy. This tool cannot refund or change charges.",
          annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
          inputSchema: { type: "object", properties: { id: { type: "string" } }, required: ["id"] },
          async execute(input) {
            const response = retryPayment(input);
            if (response.ok) recordNativeFinding("retry_payment", response, `Native agent retried ${response.id} under pre-authorized policy.`);
            else addLog(`Native retry of ${String(input.id)} was blocked with PREAUTHORIZED_POLICY_VIOLATION.`);
            return JSON.stringify(response);
          }
        },
        {
          name: "request_capability",
          description: "Request narrowly scoped authority from the human when a needed action is unavailable.",
          annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
          inputSchema: {
            type: "object",
            properties: {
              capability: { type: "string", enum: ["refund_scoped_transactions"] },
              scope: {
                type: "object",
                properties: {
                  transactions: { type: "array", minItems: 1, items: { type: "string" } },
                  maxAmount: { type: "number", exclusiveMinimum: 0 }
                },
                required: ["transactions", "maxAmount"]
              },
              reason: { type: "string", minLength: 1 }
            },
            required: ["capability", "scope", "reason"]
          },
          async execute(input) {
            if (phase === "denied") {
              addLog("Native agent re-requested authority after operator denial; blocked by DO_NOT_RETRY policy.");
              return JSON.stringify({
                ok: false,
                error: "CAPABILITY_DENIED_BY_OPERATOR",
                policy: "DO_NOT_RETRY",
                recommendation: "Human operator denied refund authority for this run. Record pending exceptions in manual queue and conclude run."
              });
            }
            const response = validateCapabilityRequest(input);
            if (!response.ok || !response.request) {
              addLog("Native agent submitted an invalid authority request; no capability was exposed.");
              return JSON.stringify(response);
            }
            setPendingRequest(response.request);
            setMaxAmount(response.request.scope.maxAmount);
            setMaxTotalAmount(response.request.scope.maxAmount <= 72 ? 150 : 304);
            setPhase("request");
            addLog(`Native agent requested ${response.request.capability} for ${response.request.scope.transactions.length} verified transactions, up to $${response.request.scope.maxAmount} each.`);
            return JSON.stringify({ ok: true, status: "human_authorization_required", request: response.request });
          }
        }
      ];

      try {
        for (const tool of tools) await context.registerTool(tool, { signal: controller.signal });
        setNativeStatus("ready");
      } catch {
        setNativeStatus("fallback");
      }
    };
    void register();
    return () => controller.abort();
  }, [addLog, recordNativeFinding]);

  useEffect(() => {
    if (!grantActive || !activeGrant) return;
    const context = getModelContext();
    if (!context?.registerTool) return;
    const controller = new AbortController();
    const register = async () => {
      try {
        await context.registerTool({
          name: "refund_scoped_transactions",
          description: `Refund only ${activeGrant.transactions.join(", ")}, up to $${activeGrant.maxAmount} per transaction. Return SCOPE_VIOLATION for any other ID or higher amount.`,
          annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false },
          inputSchema: {
            type: "object",
            properties: {
              transactions: {
                type: "array",
                description: "Refund instructions constrained by the active human grant.",
                minItems: 1,
                items: { type: "object", properties: { id: { type: "string" }, amount: { type: "number", exclusiveMinimum: 0 } }, required: ["id", "amount"] }
              }
            },
            required: ["transactions"]
          },
          async execute(input) {
            const response = validateRefund(input, activeGrant);
            setToolResult(response);
            if (response.ok) setPhase("completed");
            addLog(response.ok ? "Native WebMCP tool completed an in-scope refund call." : "Native WebMCP blocked an out-of-scope refund call with SCOPE_VIOLATION.");
            return JSON.stringify(response);
          }
        }, { signal: controller.signal });
      } catch {
        addLog("The visual grant is active; native registration was unavailable in this browser context.");
      }
    };
    void register();
    return () => controller.abort();
  }, [activeGrant, addLog, grantActive]);

  useEffect(() => () => {
    if (investigationTimer.current) clearTimeout(investigationTimer.current);
  }, []);

  useEffect(() => {
    if (!grantActive || phase !== "granted") return;
    const interval = setInterval(() => {
      setTtlSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setGrantActive(false);
          setPhase("expired");
          addLog("CAPABILITY_EXPIRED: 60-second grant TTL elapsed; temporary refund capability auto-revoked by policy.");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [addLog, grantActive, phase]);

  function startDemoReplay() {
    if (investigationTimer.current) clearTimeout(investigationTimer.current);
    setPhase("investigating");
    setToolResult(null);
    setPendingRequest(defaultCapabilityRequest);
    setMaxAmount(defaultCapabilityRequest.scope.maxAmount);
    setMaxTotalAmount(150);
    setTtlSeconds(60);
    setActiveGrant(null);
    setGrantActive(false);
    setFindings(createEmptyFindings());
    addLog(nativeStatus === "ready"
      ? "Demo replay started. This labelled fallback is not native agent proof."
      : "Demo replay started because native WebMCP is unavailable.");
    addLog("Intent accepted. Sloth begins with four baseline capabilities and no refund authority.");
    investigationTimer.current = setTimeout(() => {
      const afterIssues = applyInvestigationFinding(createEmptyFindings(), "inspect_issues", issueSummary);
      setFindings(afterIssues);
      addLog("Replay inspected today’s payment issues.");
      investigationTimer.current = setTimeout(() => {
        const afterDuplicates = transactions.reduce((current: Findings, transaction: { id: string; amount: number; customer: string }) => (
          applyInvestigationFinding(current, "inspect_transaction", transaction)
        ), afterIssues);
        setFindings(afterDuplicates);
        addLog("Replay confirmed three duplicate charges.");
        investigationTimer.current = setTimeout(() => {
          const afterRetries = retryablePayments.reduce((current, id) => (
            applyInvestigationFinding(current, "retry_payment", { ok: true, id })
          ), afterDuplicates);
          setFindings(afterRetries);
          addLog("Replay resolved pre-authorized retries.");
          setPhase("request");
          addLog("Inspection confirmed three duplicate charges. No refund capability is available.");
          addLog(`Sloth requested narrow refund authority for ${defaultCapabilityRequest.scope.transactions.join(", ")}, up to $${defaultCapabilityRequest.scope.maxAmount} each.`);
        }, 450);
      }, 450);
    }, 350);
  }

  function grantScope() {
    setAdjusting(false);
    const totalCap = maxAmount <= 72 ? 150 : 304;
    setMaxTotalAmount(totalCap);
    setActiveGrant({ transactions: [...pendingRequest.scope.transactions], maxAmount, maxTotalAmount: totalCap });
    setGrantActive(true);
    setTtlSeconds(60);
    setPhase("granted");
    addLog(`Human granted refund authority: 3 transactions, ≤ $${maxAmount} each, ≤ $${totalCap} aggregate (60s TTL).`);
  }

  function denyScope() {
    setPhase("denied");
    addLog("Human denied refund authority. DO_NOT_RETRY policy engaged. Sloth records duplicates and halts safely.");
  }

  function simulateExpiry() {
    if (!grantActive) return;
    setTtlSeconds(0);
    setGrantActive(false);
    setPhase("expired");
    addLog("CAPABILITY_EXPIRED: Operator triggered immediate TTL expiration; temporary refund capability auto-revoked.");
  }

  function testUnapprovedId() {
    if (!activeGrant) return;
    const response = validateRefund({ transactions: [{ id: "TX-999", amount: 220 }] }, activeGrant);
    setToolResult(response);
    addLog("Boundary Test 1: Unapproved ID TX-999 was rejected with TRANSACTION_NOT_ALLOWED.");
  }

  function testUnitCapBreach() {
    if (!activeGrant) return;
    const response = validateRefund({ transactions: [{ id: "TX-48", amount: 184 }] }, activeGrant);
    setToolResult(response);
    addLog(`Boundary Test 2: Unit amount $184 was rejected exceeding approved limit ($${activeGrant.maxAmount}) with AMOUNT_OVER_GRANT.`);
  }

  function testAggregateCapBreach() {
    if (!activeGrant) return;
    const response = validateRefund({ transactions: [{ id: "TX-48", amount: 48 }, { id: "TX-72", amount: 72 }, { id: "TX-184", amount: 72 }] }, activeGrant);
    setToolResult(response);
    addLog(`Boundary Test 3: Batch sum ($192) was rejected exceeding aggregate limit ($${activeGrant.maxTotalAmount ?? 150}) with AGGREGATE_AMOUNT_OVER_GRANT.`);
  }

  function executeRefunds() {
    if (!activeGrant) return;
    const plan = planRefunds(activeGrant);
    const response = validateRefund({ transactions: plan.approved.map(({ id, amount }: { id: string; amount: number }) => ({ id, amount })) }, activeGrant);
    setToolResult(response);
    if (response.ok) {
      // Single-use capability auto-revocation:
      setGrantActive(false);
      setPhase("completed");
      addLog(plan.deferred.length ? `Sloth refunded ${plan.approved.length} duplicates and left ${plan.deferred.length} untouched outside the adjusted cap.` : "Sloth refunded all three verified duplicates within the approved scope.");
      addLog("CAPABILITY_CONSUMED: Single-use refund capability consumed upon execution; authority returned to baseline (05 → 04).");
    }
  }

  function endRun() {
    setGrantActive(false);
    setPhase("closed");
    addLog("Run ended. The scoped refund capability was removed.");
  }

  function replay() {
    if (investigationTimer.current) clearTimeout(investigationTimer.current);
    setPhase("idle");
    setGrantActive(false);
    setPendingRequest(defaultCapabilityRequest);
    setActiveGrant(null);
    setMaxAmount(defaultCapabilityRequest.scope.maxAmount);
    setMaxTotalAmount(150);
    setTtlSeconds(60);
    setAdjusting(false);
    setToolResult(null);
    setFindings(createEmptyFindings());
    setLogs([{ time: clock(), message: "Run reset. Four baseline capabilities remain available; no refund authority is exposed." }]);
  }

  function exportAuditLedger() {
    const auditRecord = {
      schemaVersion: "1.0.0",
      auditRecordId: `audit-sloth-${Date.now()}`,
      generatedAt: new Date().toISOString(),
      complianceStandard: "WebMCP Scoped Authority Audit v1",
      environment: {
        nativeWebMCP: nativeStatus === "ready",
        mode: nativeStatus === "ready" ? "native_model_context" : "simulated_console"
      },
      operatorIntent: "Clean up today’s payment problems. Only bother me when you actually need my authority.",
      investigationFindings: {
        issuesReviewed: findings.issuesReviewed,
        duplicatesConfirmed: findings.duplicatesConfirmed,
        retriesResolved: findings.retriesResolved,
        verifiedTransactions: findings.inspectedDuplicateIds,
        retriedPayments: findings.retriedIds
      },
      capabilityRequest: pendingRequest,
      humanGovernance: {
        status: phase === "denied" ? "DENIED" : phase === "expired" ? "EXPIRED_REVOKED" : activeGrant ? "GRANTED" : "PENDING",
        unitCapApproved: activeGrant?.maxAmount ?? null,
        aggregateCapEnforced: activeGrant?.maxTotalAmount ?? null,
        ttlConfiguredSeconds: 60,
        ttlRemainingSeconds: ttlSeconds
      },
      runtimeLifecycle: {
        initialToolCount: 4,
        activeToolCount: grantActive ? 5 : 4,
        currentPhase: phase,
        reversibilityEnforced: true
      },
      executionReceipts: toolResult ? [toolResult] : [],
      eventLog: logs
    };

    const blob = new Blob([JSON.stringify(auditRecord, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `sloth-run-audit-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
    addLog("Compliance audit record exported to JSON.");
  }

  const isRunning = phase !== "idle" && phase !== "closed" && phase !== "denied" && phase !== "expired";
  const title = {
    idle: "Waiting for intent",
    investigating: "Investigating payment issues",
    request: "Authority boundary reached",
    granted: "Scoped authority granted",
    completed: "Outcome delivered",
    closed: "Run closed — authority removed",
    denied: "Authority request denied",
    expired: "Grant expired — authority auto-revoked"
  }[phase];
  const status = {
    idle: "Idle",
    investigating: "Investigating",
    request: "Needs authority",
    granted: "Authority granted",
    completed: "Ready to revoke",
    closed: "Closed",
    denied: "Adapted",
    expired: "Expired"
  }[phase];
  const statusClass = phase === "granted" ? "granted" : phase === "expired" ? "running" : phase === "completed" || phase === "closed" || phase === "denied" ? "done" : isRunning ? "running" : "";
  const refundedCount = Array.isArray(toolResult?.refunds) ? toolResult.refunds.length : 0;
  const deferredCount = Math.max(0, transactions.length - refundedCount);
  const requestedTransactions = transactions.filter(({ id }: { id: string }) => pendingRequest.scope.transactions.includes(id));

  return (
    <main className="shell">
      {/* Navigation Header */}
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Sloth home">
          <img src="/logo.png" alt="Sloth" className="brand-logo-img" />
          <span>SLOTH</span>
        </a>
        <ul className="nav-links">
          <li><a href="#features">Architecture</a></li>
          <li><a href="#console">Operations</a></li>
          <li><a href="#enforcement">Enforcement</a></li>
        </ul>
        <div className={`webmcp-indicator ${nativeStatus}`} aria-live="polite" aria-label={nativeStatus === "ready" ? "WebMCP native tools online" : nativeStatus === "fallback" ? "WebMCP simulation mode" : "Checking WebMCP connection"}>
          <span className="indicator-beacon" aria-hidden="true" />
          <span className="indicator-label">WebMCP</span>
          <span className="indicator-sep">/</span>
          <span className="indicator-state">
            {nativeStatus === "ready" ? "Native Live" : nativeStatus === "fallback" ? "Simulation" : "Connecting"}
          </span>
        </div>
      </header>

      {/* Section 1: Hero */}
      <section className="hero-section" id="top">
        <div className="hero-grid">
          <div className="hero-content">
            <p className="eyebrow">Payment operations / controlled autonomy</p>
            <h1>Clean up today’s<br /><span>payment problems.</span></h1>
            <p className="lead">Delegate outcomes, not unlimited access. Sloth equips autonomous agents with narrow baseline tools, surfacing temporary financial capabilities only through verified, human-approved grants.</p>
            <div className="hero-actions">
              {phase === "idle" ? (
                <button className="primary" onClick={startDemoReplay}>Launch Delegated Run <span aria-hidden="true">→</span></button>
              ) : phase === "closed" || phase === "denied" ? (
                <button className="primary" onClick={replay}>Re-arm Console <span aria-hidden="true">↻</span></button>
              ) : (
                <a href="#console" className="primary">Console Active <span aria-hidden="true">↓</span></a>
              )}
              <a href="#features" className="secondary">Explore Architecture <span aria-hidden="true">↓</span></a>
            </div>
            {nativeStatus === "ready" ? (
              <p className="hero-note">Native tools are live. Connect your WebMCP agent or Inspector to interact.</p>
            ) : (
              <p className="hero-note">Autonomous simulation mode active for standard browsers.</p>
            )}
          </div>
          <div className="hero-visual">
            <div className="hero-visual-frame">
              <div className="hero-visual-tag">Runtime Authority Boundary</div>
              <img src="/hero-sloth.png" alt="Sloth Autonomous Agent" className="hero-img" />
              <p className="hero-visual-caption">Dynamic Capability Lifecycle · Zero Standing Financial Privileges</p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Architecture & Core Features */}
      <section className="section-fullscreen" id="features">
        <div className="section-header">
          <p className="eyebrow">Dynamic Capability Architecture</p>
          <h2>Authority that scales with trust.</h2>
          <p>Traditional architectures rely on dangerous permanent API keys or spam human approvals on every step. Sloth introduces a deterministic three-phase boundary: narrow by default, temporary when escalated, and enforced inside the tool execution handler.</p>
        </div>
        <div className="features-grid">
          <article className="feature-card">
            <div className="feature-top">
              <span className="feature-layer">Phase 01 / Least Privilege</span>
              <h3>Narrow Baseline Discovery</h3>
              <p>The agent begins with read-only inspection tools and pre-authorized idempotent retries. Financial mutations do not exist in the browser context.</p>
            </div>
            <div className="feature-visual">
              <div className="feature-tool-list">
                <div className="feature-tool-row"><span className="feature-tool-name"><code>inspect_issues</code></span><span className="feature-tool-meta green">read-only</span></div>
                <div className="feature-tool-row"><span className="feature-tool-name"><code>inspect_transaction</code></span><span className="feature-tool-meta green">read-only</span></div>
                <div className="feature-tool-row"><span className="feature-tool-name"><code>retry_payment</code></span><span className="feature-tool-meta amber">pre-auth policy</span></div>
                <div className="feature-tool-row"><span className="feature-tool-name"><code>request_capability</code></span><span className="feature-tool-meta">boundary hook</span></div>
                <div className="feature-divider" />
                <div className="feature-tool-row"><span className="feature-tool-name"><code>refund_scoped_transactions</code></span><span className="feature-tool-meta blocked">UNREGISTERED</span></div>
              </div>
            </div>
            <div className="feature-badge active">● 04 Tools in WebMCP Registry</div>
          </article>

          <article className="feature-card">
            <div className="feature-top">
              <span className="feature-layer">Phase 02 / Hard Boundary</span>
              <h3>Just-in-Time Authority Request</h3>
              <p>When duplicate charges are confirmed, the agent halts at the boundary and calls <code>request_capability</code>. The operator approves or limits an immutable grant.</p>
            </div>
            <div className="feature-visual">
              <pre className="feature-code-snippet">{`request_capability({
  capability: "refund_scoped_transactions",
  scope: {
    transactions: ["TX-48", "TX-72"],
    maxAmount: 72
  },
  reason: "Confirmed duplicate charges"
})`}</pre>
            </div>
            <div className="feature-badge active">● Human Governed · Scope Locked</div>
          </article>

          <article className="feature-card">
            <div className="feature-top">
              <span className="feature-layer">Phase 03 / Deterministic Safety</span>
              <h3>In-Tool Enforcement &amp; Expiry</h3>
              <p>Scope constraints are checked inside the tool handler, returning structured violations. The capability disappears the moment the run closes.</p>
            </div>
            <div className="feature-visual">
              <div className="feature-steps">
                <div className="feature-step-row"><span>01</span><strong>Tool dynamically registered</strong></div>
                <div className="feature-step-row alert"><span>02</span><strong>TX-999 ($220) → SCOPE_VIOLATION</strong></div>
                <div className="feature-step-row success"><span>03</span><strong>TX-48, TX-72 refunded within grant</strong></div>
                <div className="feature-divider" />
                <div className="feature-step-row"><span>04</span><strong>Task complete → Tool unregistered</strong></div>
              </div>
            </div>
            <div className="feature-badge active">● 4 → 5 → 4 Lifecycle Validated</div>
          </article>
        </div>
      </section>

      {/* Section 3: Operations Console — Investigation & Request */}
      <section className="section-container" id="console">
        <div className="section-header">
          <p className="eyebrow">Interactive Operations Console</p>
          <h2>Delegated Outcome Workbench</h2>
          <p>Watch the agent investigate payment anomalies, execute pre-authorized recoveries, and request scoped human authority when encountering hard boundaries.</p>
        </div>

        <div className="console" aria-label="Sloth operations console">
          <aside className="authority" aria-label="Authority rail">
            <div className="rail-head"><p>Authority rail</p><span>{grantActive ? "05" : "04"}</span></div>
            <div className="rail" aria-hidden="true"><div className="rail-fill" style={{ width: grantActive ? "100%" : "0" }} /></div>
            <ul className="tool-list">
              {baselineTools.map(({ name, label }) => <li key={name}><span className="tool-dot safe" /><div><code>{name}</code><small>{label}</small></div></li>)}
              {grantActive && <li><span className="tool-dot active" /><div><code>refund_scoped_transactions</code><small>Granted · temporary</small></div></li>}
            </ul>
            <p className="rail-note">{grantActive ? "One narrow financial capability is live." : "No financial authority exposed."}</p>
          </aside>

          <div className="workspace">
            <div className="workspace-head"><div><p className="eyebrow">Delegated run</p><h2>{title}</h2></div><div className={`status ${statusClass}`}>{status}</div></div>
            <div className="intent-card"><span className="intent-symbol">↳</span><div><p className="eyebrow">Operator Intent</p><p>“Clean up today’s payment problems. Only bother me when you actually need my authority.”</p></div></div>

            <div className="investigation">
              <div className="section-label"><span>01</span> Agent investigation</div>
              <div className="issue-grid">
                <article><span className={`issue-count${findings.issuesReviewed == null ? " pending" : ""}`}>{padCount(findings.issuesReviewed)}</span><p>payment issues reviewed</p></article>
                <article><span className={`issue-count amber${findings.duplicatesConfirmed == null ? " pending" : ""}`}>{padCount(findings.duplicatesConfirmed)}</span><p>duplicate charges confirmed</p></article>
                <article><span className={`issue-count mint${findings.retriesResolved == null ? " pending" : ""}`}>{padCount(findings.retriesResolved)}</span><p>retries resolved safely</p></article>
              </div>
            </div>

            {phase === "idle" && (
              <div className="console-actions-bar">
                <button className="primary compact" onClick={startDemoReplay}>Trigger Delegated Run <span aria-hidden="true">→</span></button>
              </div>
            )}

            {phase === "request" && <div className="request-card">
              <div className="request-title"><span className="request-badge">Authority required</span><p>Sloth reached a hard boundary.</p></div>
              <h3>Agent requests refund authority</h3>
              <p className="request-copy">{pendingRequest.reason} <strong>{requestedTransactions.length} transactions · max ${maxAmount}/item · max ${maxTotalAmount} aggregate cap.</strong></p>
              <div className="transactions">{requestedTransactions.map(({ id, amount, customer }: { id: string; amount: number; customer: string }) => <span className="transaction" key={id}><b>{id}</b> · ${amount} · {customer}</span>)}</div>
              {!adjusting ? <div className="request-actions"><button className="primary compact" onClick={grantScope}>Allow this scope</button><button className="secondary compact" onClick={() => setAdjusting(true)}>Adjust</button><button className="quiet compact" onClick={denyScope}>Deny</button></div> : <div className="adjuster"><label htmlFor="limit">Maximum refund per transaction <output>${maxAmount} (Aggregate cap: ${maxAmount <= 72 ? 150 : 304})</output></label><input id="limit" type="range" min="48" max="184" value={maxAmount} step="8" onInput={(event) => { const val = Number(event.currentTarget.value); setMaxAmount(val); setMaxTotalAmount(val <= 72 ? 150 : 304); }} /><div><button className="secondary compact" onClick={() => setAdjusting(false)}>Cancel</button><button className="primary compact" onClick={grantScope}>Confirm revised grant</button></div></div>}
            </div>}

            {/* Section 4: Runtime Enforcement & Boundary Testing */}
            <div className="enforcement-box" id="enforcement">
              <div className="section-label"><span>02</span> Scoped runtime enforcement &amp; boundary testing</div>

              {(phase === "granted" || phase === "completed") ? (
                <div className="execution">
                  <div className="grant-strip">
                    <span className="tool-dot active" />
                    <code>refund_scoped_transactions</code>
                    <span className="grant-scope-text">Live · {activeGrant?.transactions.length ?? 0} tx · ≤ ${activeGrant?.maxAmount ?? maxAmount}/item · ≤ ${activeGrant?.maxTotalAmount ?? maxTotalAmount} aggregate</span>
                    <div className={`grant-ttl${ttlSeconds <= 15 ? " urgent" : ""}`}>
                      <span>⏱ 00:{String(ttlSeconds).padStart(2, "0")}s TTL</span>
                      {phase === "granted" && (
                        <button className="quiet compact ttl-fastforward" onClick={simulateExpiry} title="Simulate 60s TTL expiry for testing">Fast-forward ⚡</button>
                      )}
                    </div>
                  </div>
                  {phase === "granted" && (
                    <>
                      <div className="execution-actions" style={{ marginTop: "16px" }}>
                        <button className="primary compact" onClick={executeRefunds}>Execute verified refunds (Single-use)</button>
                      </div>
                      <div className="test-suite-box">
                        <div className="test-suite-label">Boundary Verification Test Suite (In-tool safety checks)</div>
                        <div className="test-suite-actions">
                          <button className="test-suite-btn" onClick={testUnapprovedId}>1. Test Unapproved ID (TX-999)</button>
                          <button className="test-suite-btn" onClick={testUnitCapBreach}>2. Test Unit Cap Breach ($184)</button>
                          <button className="test-suite-btn" onClick={testAggregateCapBreach}>3. Test Aggregate Cap Breach ($192)</button>
                        </div>
                      </div>
                    </>
                  )}
                  {toolResult && <pre className="tool-result" aria-live="polite">{JSON.stringify(toolResult, null, 2)}</pre>}
                </div>
              ) : phase === "closed" || phase === "denied" || phase === "expired" ? null : (
                <div className="standby-card">
                  <p>Awaiting capability grant: No financial mutation capability is currently registered in the runtime. Once an authority request is approved above, runtime boundary testing, live 60s TTL countdown, and execution controls will activate here.</p>
                </div>
              )}

              {phase === "completed" && (
                <div className="completion">
                  <div>
                    <span className="check">✓</span>
                    <div>
                      <p className="eyebrow">Outcome delivered</p>
                      <h3>{refundedCount} duplicate charge{refundedCount === 1 ? "" : "s"} refunded.</h3>
                      <p>{deferredCount ? `${deferredCount} transaction${deferredCount === 1 ? " was" : "s were"} left untouched because the adjusted grant did not cover the amount.` : "Sloth is done. Revoke the temporary authority."}</p>
                    </div>
                  </div>
                  <div className="completion-actions">
                    <button className="secondary compact" onClick={exportAuditLedger}>Export Audit Ledger (.json)</button>
                    <button className="quiet compact" onClick={endRun}>End run &amp; revoke authority</button>
                  </div>
                </div>
              )}

              {phase === "expired" && (
                <div className="completion expired-card">
                  <div>
                    <span className="check warning">⏱</span>
                    <div>
                      <p className="eyebrow">Automatic Safety Boundary</p>
                      <h3>Temporary authority expired &amp; revoked.</h3>
                      <p>The 60-second grant time-to-live elapsed. The refund capability was automatically unregistered from WebMCP without requiring human intervention.</p>
                    </div>
                  </div>
                  <div className="completion-actions">
                    <button className="secondary compact" onClick={exportAuditLedger}>Export Audit Ledger (.json)</button>
                    <button className="primary compact" onClick={replay}>Re-arm Console</button>
                  </div>
                </div>
              )}

              {(phase === "closed" || phase === "denied") && (
                <div className="completion">
                  <div>
                    <span className="check">✓</span>
                    <div>
                      <p className="eyebrow">Safe stop</p>
                      <h3>{phase === "closed" ? "Temporary authority removed." : "Decision respected."}</h3>
                      <p>{phase === "closed" ? "The refund tool no longer exists in the agent’s tool surface." : "No financial capability was exposed. Agent received DO_NOT_RETRY policy."}</p>
                    </div>
                  </div>
                  <div className="completion-actions">
                    <button className="secondary compact" onClick={exportAuditLedger}>Export Audit Ledger (.json)</button>
                    <button className="quiet compact" onClick={replay}>Re-arm Console</button>
                  </div>
                </div>
              )}

              <div className="activity-wrap">
                <div className="activity-header-bar">
                  <div className="section-label"><span>Live</span> Decision audit stream</div>
                  <button className="secondary compact" onClick={exportAuditLedger}>Export Audit Ledger (.json) ⤓</button>
                </div>
                <ol className="activity" aria-live="polite">{logs.map((item, index) => <li key={`${item.time}-${index}`}><time>{item.time}</time><span>{item.message}</span></li>)}</ol>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 5: Closing CTA */}
      <section className="cta-section" id="cta">
        <div className="cta-grid">
          <div className="cta-content">
            <p className="eyebrow">Standardizing Agent Authority</p>
            <h2>Ready to delegate outcomes with scoped authority?</h2>
            <p>Inspect live WebMCP tools in Chrome DevTools or Google’s Model Context Tool Inspector, test autonomous runtime adaptation, and explore how just-in-time capability grants replace permanent API keys.</p>
            <div className="cta-actions">
              <a href="#console" className="primary" onClick={phase === "idle" ? startDemoReplay : undefined}>Launch Delegated Run <span aria-hidden="true">→</span></a>
              <a href="https://github.com/emmaGH1/sloth.git" target="_blank" rel="noreferrer" className="secondary">View GitHub Source <span aria-hidden="true">↗</span></a>
            </div>
          </div>
          <div className="cta-links-box">
            <div className="cta-links-title">Specifications &amp; References</div>
            <a href="https://webmcp.devpost.com/" target="_blank" rel="noreferrer" className="cta-link-item"><span>↗</span> WebMCP Protocol Challenge</a>
            <a href="https://github.com/emmaGH1/sloth" target="_blank" rel="noreferrer" className="cta-link-item"><span>↗</span> Open Source Repository (MIT)</a>
            <a href="#features" className="cta-link-item"><span>↓</span> Architecture Documentation</a>
            <a href="#console" className="cta-link-item"><span>↓</span> Live Operations Console</a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="site-footer">
        <div className="footer-brand">
          <img src="/logo.png" alt="Sloth" className="footer-logo" />
          <span>SLOTH — Delegate outcomes, not unlimited access.</span>
        </div>
        <div>MIT License · WebMCP Challenge Submission</div>
      </footer>
    </main>
  );
}
