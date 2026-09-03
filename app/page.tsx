"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { confirmedTransactions as transactions, planRefunds, validateRefund } from "../scope.js";

type Phase = "idle" | "investigating" | "request" | "granted" | "completed" | "closed" | "denied";
type ToolDefinition = {
  name: string;
  description: string;
  inputSchema?: Record<string, unknown>;
  execute(input: Record<string, unknown>): Promise<string> | string;
};
type ModelContext = {
  registerTool(tool: ToolDefinition, options?: { signal?: AbortSignal }): Promise<unknown>;
};
type LogItem = { time: string; message: string };

const safeToolNames = ["inspect_issues", "inspect_transaction", "retry_payment", "request_capability"];

function getModelContext(): ModelContext | undefined {
  const doc = document as Document & { modelContext?: ModelContext };
  const nav = navigator as Navigator & { modelContext?: ModelContext };
  return doc.modelContext || nav.modelContext;
}

function clock() {
  return new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }).format(new Date());
}

export default function Home() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [nativeStatus, setNativeStatus] = useState<"checking" | "ready" | "fallback">("checking");
  const [maxAmount, setMaxAmount] = useState(184);
  const [adjusting, setAdjusting] = useState(false);
  const [grantActive, setGrantActive] = useState(false);
  const [toolResult, setToolResult] = useState<Record<string, unknown> | null>(null);
  const [logs, setLogs] = useState<LogItem[]>([{ time: "09:41:02", message: "Run is waiting for your intent." }]);
  const investigationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const addLog = useCallback((message: string) => {
    setLogs((current) => [...current, { time: clock(), message }]);
  }, []);

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
          async execute() { return JSON.stringify({ issuesReviewed: 14, duplicateChargesConfirmed: 3, retriesResolved: 8 }); }
        },
        {
          name: "inspect_transaction",
          description: "Read a named payment transaction without changing it.",
          inputSchema: { type: "object", properties: { id: { type: "string" } }, required: ["id"] },
          async execute(input) {
            const match = transactions.find((transaction: { id: string }) => transaction.id === input.id);
            return JSON.stringify(match || { error: { code: "NOT_FOUND", id: input.id } });
          }
        },
        {
          name: "retry_payment",
          description: "Retry a failed payment. This tool cannot refund or change customer charges.",
          inputSchema: { type: "object", properties: { id: { type: "string" } }, required: ["id"] },
          async execute(input) { return JSON.stringify({ ok: true, id: input.id, status: "retry_queued" }); }
        },
        {
          name: "request_capability",
          description: "Request narrowly scoped authority from the human when a needed action is unavailable.",
          inputSchema: { type: "object", properties: { capability: { type: "string" }, reason: { type: "string" } }, required: ["capability", "reason"] },
          async execute(input) {
            setPhase("request");
            addLog(`Native agent requested ${String(input.capability)}: ${String(input.reason)}`);
            return JSON.stringify({ ok: true, status: "human_authorization_required", capability: input.capability });
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
  }, [addLog]);

  useEffect(() => {
    if (!grantActive) return;
    const context = getModelContext();
    if (!context?.registerTool) return;
    const controller = new AbortController();
    const register = async () => {
      try {
        await context.registerTool({
          name: "refund_scoped_transactions",
          description: `Refund only TX-48, TX-72, and TX-184, up to $${maxAmount} per transaction. Return SCOPE_VIOLATION for any other ID or higher amount.`,
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
            const response = validateRefund(input, maxAmount);
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
  }, [addLog, grantActive, maxAmount]);

  useEffect(() => () => {
    if (investigationTimer.current) clearTimeout(investigationTimer.current);
  }, []);

  function startRun() {
    setPhase("investigating");
    setToolResult(null);
    addLog("Intent accepted. Sloth begins with four safe capabilities only.");
    investigationTimer.current = setTimeout(() => {
      setPhase("request");
      addLog("Inspection confirmed three duplicate charges. No refund capability is available.");
      addLog("Sloth requested narrow refund authority for TX-48, TX-72, and TX-184.");
    }, 650);
  }

  function grantScope() {
    setAdjusting(false);
    setGrantActive(true);
    setPhase("granted");
    addLog(`Human granted refund authority: 3 named transactions, ≤ $${maxAmount} each.`);
  }

  function denyScope() {
    setPhase("denied");
    addLog("Human denied refund authority. Sloth records the duplicates for follow-up and ends safely.");
  }

  function testBoundary() {
    const response = validateRefund({ transactions: [{ id: "TX-999", amount: 220 }] }, maxAmount);
    setToolResult(response);
    addLog("A broader refund was rejected with SCOPE_VIOLATION. Sloth adapts to the approved set.");
  }

  function executeRefunds() {
    const plan = planRefunds(maxAmount);
    const response = validateRefund({ transactions: plan.approved.map(({ id, amount }: { id: string; amount: number }) => ({ id, amount })) }, maxAmount);
    setToolResult(response);
    if (response.ok) {
      setPhase("completed");
      addLog(plan.deferred.length ? `Sloth refunded ${plan.approved.length} duplicates and left ${plan.deferred.length} untouched outside the adjusted cap.` : "Sloth refunded all three verified duplicates within the approved scope.");
    }
  }

  function endRun() {
    setGrantActive(false);
    setPhase("closed");
    addLog("Run ended. The scoped refund capability was removed.");
  }

  function replay() {
    setPhase("idle");
    setGrantActive(false);
    setMaxAmount(184);
    setAdjusting(false);
    setToolResult(null);
    setLogs([{ time: clock(), message: "Run reset. Four safe capabilities remain available." }]);
  }

  const isRunning = phase !== "idle" && phase !== "closed" && phase !== "denied";
  const title = {
    idle: "Waiting for intent",
    investigating: "Investigating payment issues",
    request: "Authority boundary reached",
    granted: "Scoped authority granted",
    completed: "Outcome delivered",
    closed: "Run closed — authority removed",
    denied: "Authority request denied"
  }[phase];
  const status = {
    idle: "Idle",
    investigating: "Investigating",
    request: "Needs authority",
    granted: "Authority granted",
    completed: "Ready to revoke",
    closed: "Closed",
    denied: "Adapted"
  }[phase];
  const statusClass = phase === "granted" ? "granted" : phase === "completed" || phase === "closed" || phase === "denied" ? "done" : isRunning ? "running" : "";
  const refundedCount = Array.isArray(toolResult?.refunds) ? toolResult.refunds.length : 0;
  const deferredCount = Math.max(0, transactions.length - refundedCount);

  return (
    <main className="shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Sloth home"><span className="brand-mark">S</span> SLOTH</a>
        <p className="tagline">Delegate outcomes, <em>not unlimited access.</em></p>
        <div className={`connection ${nativeStatus}`} aria-live="polite"><span />{nativeStatus === "ready" ? "WebMCP ready" : nativeStatus === "fallback" ? "Visual fallback active" : "Checking WebMCP"}</div>
      </header>

      <section className="hero" id="top">
        <p className="eyebrow">Payment operations / 09:41 WAT</p>
        <h1>Clean up today’s<br /><span>payment problems.</span></h1>
        <p className="lead">Hand Sloth the outcome. It only stops when it genuinely needs your authority.</p>
        {phase === "idle" ? <button className="primary" onClick={startRun}>Start delegated run <span aria-hidden="true">→</span></button> : phase === "closed" || phase === "denied" ? <button className="primary" onClick={replay}>Replay judge path <span aria-hidden="true">↻</span></button> : <button className="primary" disabled>Delegated run in progress</button>}
      </section>

      <section className="console" aria-label="Sloth operations console">
        <aside className="authority" aria-label="Authority rail">
          <div className="rail-head"><p>Authority rail</p><span>{grantActive ? "05" : "04"}</span></div>
          <div className="rail" aria-hidden="true"><div className="rail-fill" style={{ width: grantActive ? "100%" : "0" }} /></div>
          <ul className="tool-list">
            {safeToolNames.map((name) => <li key={name}><span className="tool-dot safe" /><div><code>{name}</code><small>Safe</small></div></li>)}
            {grantActive && <li><span className="tool-dot active" /><div><code>refund_scoped_transactions</code><small>Granted · temporary</small></div></li>}
          </ul>
          <p className="rail-note">{grantActive ? "One narrow financial capability is live." : "No financial authority exposed."}</p>
        </aside>

        <div className="workspace">
          <div className="workspace-head"><div><p className="eyebrow">Delegated run</p><h2>{title}</h2></div><div className={`status ${statusClass}`}>{status}</div></div>
          <div className="intent-card"><span className="intent-symbol">↳</span><div><p className="eyebrow">Human intent</p><p>“Clean up today’s payment problems. Only bother me when you actually need my authority.”</p></div></div>

          <div className="investigation">
            <div className="section-label"><span>01</span> Agent investigation</div>
            <div className="issue-grid">
              <article><span className="issue-count">14</span><p>payment issues reviewed</p></article>
              <article><span className="issue-count amber">03</span><p>duplicate charges confirmed</p></article>
              <article><span className="issue-count mint">08</span><p>retries resolved safely</p></article>
            </div>
          </div>

          {phase === "request" && <div className="request-card">
            <div className="request-title"><span className="request-badge">Authority required</span><p>Sloth reached a hard boundary.</p></div>
            <h3>Agent requests refund authority</h3>
            <p className="request-copy">Three duplicate charges are verified. <strong>3 transactions · up to ${maxAmount} each.</strong></p>
            <div className="transactions">{transactions.map(({ id, amount, customer }: { id: string; amount: number; customer: string }) => <span className="transaction" key={id}><b>{id}</b> · ${amount} · {customer}</span>)}</div>
            {!adjusting ? <div className="request-actions"><button className="primary compact" onClick={grantScope}>Allow this scope</button><button className="secondary compact" onClick={() => setAdjusting(true)}>Adjust</button><button className="quiet compact" onClick={denyScope}>Deny</button></div> : <div className="adjuster"><label htmlFor="limit">Maximum refund per transaction <output>${maxAmount}</output></label><input id="limit" type="range" min="48" max="184" value={maxAmount} step="8" onChange={(event) => setMaxAmount(Number(event.target.value))} /><div><button className="secondary compact" onClick={() => setAdjusting(false)}>Cancel</button><button className="primary compact" onClick={grantScope}>Confirm revised grant</button></div></div>}
          </div>}

          {(phase === "granted" || phase === "completed") && <div className="execution">
            <div className="section-label"><span>02</span> Scoped execution</div>
            <div className="grant-strip"><span className="tool-dot active" /><code>refund_scoped_transactions</code><span>Live · 3 transactions · ≤ ${maxAmount}</span></div>
            <p>Sloth can refund only the transactions and amounts you approved. The boundary is checked inside the tool, not just on this screen.</p>
            {phase === "granted" && <div className="execution-actions"><button className="secondary compact" onClick={testBoundary}>Test an out-of-scope call</button><button className="primary compact" onClick={executeRefunds}>Execute verified refunds</button></div>}
            {toolResult && <pre className="tool-result" aria-live="polite">{JSON.stringify(toolResult, null, 2)}</pre>}
          </div>}

          {phase === "completed" && <div className="completion"><div><span className="check">✓</span><div><p className="eyebrow">Outcome delivered</p><h3>{refundedCount} duplicate charge{refundedCount === 1 ? "" : "s"} refunded.</h3><p>{deferredCount ? `${deferredCount} transaction${deferredCount === 1 ? " was" : "s were"} left untouched because the adjusted grant did not cover the amount.` : "Sloth is done. Revoke the temporary authority."}</p></div></div><button className="quiet compact" onClick={endRun}>End run &amp; revoke authority</button></div>}

          {(phase === "closed" || phase === "denied") && <div className="completion"><div><span className="check">✓</span><div><p className="eyebrow">Safe stop</p><h3>{phase === "closed" ? "Temporary authority removed." : "Decision respected."}</h3><p>{phase === "closed" ? "The refund tool no longer exists in the agent’s tool surface." : "No financial capability was exposed."}</p></div></div><button className="quiet compact" onClick={replay}>Replay demo</button></div>}

          <div className="activity-wrap"><div className="section-label"><span>Live</span> Decision log</div><ol className="activity" aria-live="polite">{logs.map((item, index) => <li key={`${item.time}-${index}`}><time>{item.time}</time><span>{item.message}</span></li>)}</ol></div>
        </div>
      </section>
      <p className="footnote">Built for agentic browsing. <span>{grantActive ? "The scoped refund tool is live." : nativeStatus === "ready" ? "Four safe tools are available; no refund tool is registered." : "The in-console capability simulation is active."}</span></p>
    </main>
  );
}
