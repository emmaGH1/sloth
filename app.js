import { confirmedTransactions as transactions, validateRefund } from "./scope.js";

const state = { running: false, granted: false, completed: false, maxAmount: 184, controller: null, safeController: null, native: false };
const $ = (id) => document.getElementById(id);
const clock = () => new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }).format(new Date());

function log(message) {
  const item = document.createElement("li");
  item.innerHTML = `<time>${clock()}</time><span>${message}</span>`;
  $("activity").append(item);
  item.scrollIntoView({ block: "nearest", behavior: "smooth" });
}

function setStatus(label, style = "") {
  const status = $("runStatus");
  status.textContent = label;
  status.className = `status ${style}`;
}

function renderTransactions() {
  $("transactions").innerHTML = transactions.map(({ id, amount, customer }) => `<span class="transaction"><b>${id}</b> · $${amount} · ${customer}</span>`).join("");
}

function addRefundToolToRail() {
  const row = document.createElement("li");
  row.id = "refundRailItem";
  row.innerHTML = '<span class="tool-dot active"></span><div><code>refund_scoped_transactions</code><small>Granted · temporary</small></div>';
  $("toolList").append(row);
  $("authorityCount").textContent = "05";
  $("railFill").style.width = "100%";
  $("railNote").textContent = "One narrow financial capability is live.";
}

function removeRefundToolFromRail() {
  $("refundRailItem")?.remove();
  $("authorityCount").textContent = "04";
  $("railFill").style.width = "0";
  $("railNote").textContent = "No financial authority exposed.";
}

function responseForRefund(input) {
  return validateRefund(input, state.maxAmount);
}

async function registerRefundTool() {
  const context = document.modelContext || navigator.modelContext;
  if (!context?.registerTool) return;
  state.controller = new AbortController();
  try {
    await context.registerTool({
      name: "refund_scoped_transactions",
      description: "Refund only the three human-approved duplicate transactions. Each refund amount must not exceed the current approved per-transaction limit. Returns a structured SCOPE_VIOLATION error for any other transaction or amount.",
      inputSchema: { type: "object", properties: { transactions: { type: "array", description: "Refund instructions, limited to TX-48, TX-72, and TX-184.", items: { type: "object", properties: { id: { type: "string" }, amount: { type: "number" } }, required: ["id", "amount"] } } }, required: ["transactions"] },
      async execute(input) {
        const response = responseForRefund(input);
        log(response.ok ? "WebMCP tool completed an in-scope refund call." : "WebMCP blocked an out-of-scope refund call with SCOPE_VIOLATION.");
        return JSON.stringify(response);
      }
    }, { signal: state.controller.signal });
    $("toolSurface").textContent = "The scoped refund tool is live in the browser’s WebMCP surface.";
  } catch (error) {
    log(`Native tool registration was unavailable: ${error.name || "browser restriction"}. The console scope boundary remains active.`);
  }
}

async function registerSafeTools() {
  const context = document.modelContext || navigator.modelContext;
  if (!context?.registerTool) return;
  state.safeController = new AbortController();
  const tools = [
    { name: "inspect_issues", description: "Read the day’s payment issue summary. This capability cannot make financial changes.", execute: () => ({ issuesReviewed: 14, duplicateChargesConfirmed: 3, retriesResolved: 8 }) },
    { name: "inspect_transaction", description: "Read a named payment transaction without changing it.", execute: ({ id }) => transactions.find((transaction) => transaction.id === id) || { error: { code: "NOT_FOUND", id } }, inputSchema: { type: "object", properties: { id: { type: "string" } }, required: ["id"] } },
    { name: "retry_payment", description: "Safely retry a failed payment. It cannot refund or change customer charges.", execute: ({ id }) => ({ ok: true, id, status: "retry_queued" }), inputSchema: { type: "object", properties: { id: { type: "string" } }, required: ["id"] } },
    { name: "request_capability", description: "Request a narrowly scoped capability from the human when a needed action is not available.", execute: ({ capability, reason }) => ({ ok: true, status: "human_authorization_required", capability, reason }), inputSchema: { type: "object", properties: { capability: { type: "string" }, reason: { type: "string" } }, required: ["capability", "reason"] } }
  ];
  for (const tool of tools) {
    await context.registerTool({ ...tool, async execute(input) { return JSON.stringify(await tool.execute(input)); } }, { signal: state.safeController.signal });
  }
}

function revokeRefundTool() {
  state.controller?.abort();
  state.controller = null;
  removeRefundToolFromRail();
  $("toolSurface").textContent = "The temporary refund tool has been removed from the WebMCP surface.";
}

function showToolResult(value) {
  const result = $("toolResult");
  result.textContent = JSON.stringify(value, null, 2);
  result.classList.remove("is-hidden");
}

function startRun() {
  if (state.running) return;
  state.running = true;
  $("startRun").textContent = "Delegated run in progress";
  $("startRun").disabled = true;
  $("runTitle").textContent = "Investigating payment issues";
  setStatus("Investigating", "running");
  log("Intent accepted. Sloth begins with four safe capabilities only.");
  window.setTimeout(() => {
    $("requestCard").classList.remove("is-hidden");
    $("runTitle").textContent = "Authority boundary reached";
    setStatus("Needs authority", "running");
    log("Inspection confirmed three duplicate charges. No refund capability is available.");
    log("Sloth requested narrow refund authority for TX-48, TX-72, and TX-184.");
    $("requestCard").scrollIntoView({ behavior: "smooth", block: "center" });
  }, 650);
}

async function grantScope() {
  state.granted = true;
  $("requestActions").classList.add("is-hidden");
  $("adjuster").classList.add("is-hidden");
  $("execution").classList.remove("is-hidden");
  $("grantText").textContent = `Live · 3 transactions · ≤ $${state.maxAmount}`;
  $("runTitle").textContent = "Scoped authority granted";
  setStatus("Authority granted", "granted");
  addRefundToolToRail();
  log(`Human granted refund authority: 3 named transactions, ≤ $${state.maxAmount} each.`);
  await registerRefundTool();
  $("execution").scrollIntoView({ behavior: "smooth", block: "center" });
}

function denyScope() {
  $("requestActions").classList.add("is-hidden");
  $("runTitle").textContent = "Authority request denied";
  setStatus("Adapted", "done");
  log("Human denied refund authority. Sloth records the duplicates for human follow-up and ends safely.");
}

function testBoundary() {
  const response = responseForRefund({ transactions: [{ id: "TX-999", amount: 220 }] });
  showToolResult(response);
  log("Sloth attempted a broader refund; the tool returned SCOPE_VIOLATION. It adapts to the approved set.");
}

function executeRefunds() {
  const response = responseForRefund({ transactions: transactions.map(({ id, amount }) => ({ id, amount })) });
  showToolResult(response);
  state.completed = true;
  $("completion").classList.remove("is-hidden");
  $("runTitle").textContent = "Outcome delivered";
  setStatus("Ready to revoke", "done");
  log("Sloth refunded all three verified duplicates within the approved scope.");
}

function endRun() {
  revokeRefundTool();
  $("endRun").disabled = true;
  $("endRun").textContent = "Authority revoked";
  $("runTitle").textContent = "Run closed — authority removed";
  setStatus("Closed", "done");
  log("Run ended. The scoped refund capability was removed.");
}

function setupWebMcp() {
  const context = document.modelContext || navigator.modelContext;
  const connection = $("connection");
  if (context?.registerTool) {
    state.native = true;
    connection.className = "connection ready";
    connection.innerHTML = "<span></span> WebMCP ready";
    $("toolSurface").textContent = "Four safe tools are available; no refund tool is registered.";
    registerSafeTools().catch((error) => log(`Safe-tool registration was unavailable: ${error.name || "browser restriction"}.`));
  } else {
    connection.className = "connection fallback";
    connection.innerHTML = "<span></span> WebMCP preview unavailable";
    $("toolSurface").textContent = "The built-in simulation is active; native WebMCP needs a compatible browser context.";
  }
}

renderTransactions();
$("startRun").addEventListener("click", startRun);
$("allowGrant").addEventListener("click", grantScope);
$("denyGrant").addEventListener("click", denyScope);
$("adjustGrant").addEventListener("click", () => { $("requestActions").classList.add("is-hidden"); $("adjuster").classList.remove("is-hidden"); });
$("cancelAdjust").addEventListener("click", () => { $("adjuster").classList.add("is-hidden"); $("requestActions").classList.remove("is-hidden"); });
$("limit").addEventListener("input", (event) => { state.maxAmount = Number(event.target.value); $("limitOutput").textContent = `$${state.maxAmount}`; });
$("confirmAdjust").addEventListener("click", grantScope);
$("testBoundary").addEventListener("click", testBoundary);
$("executeRefunds").addEventListener("click", executeRefunds);
$("endRun").addEventListener("click", endRun);
window.addEventListener("load", setupWebMcp);
