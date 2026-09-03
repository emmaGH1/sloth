export const confirmedTransactions = [
  { id: "TX-48", amount: 48, customer: "Arden LLC" },
  { id: "TX-72", amount: 72, customer: "Tay Studio" },
  { id: "TX-184", amount: 184, customer: "Kiteworks" }
];

export const retryablePayments = ["PAY-17", "PAY-23", "PAY-31", "PAY-42", "PAY-56", "PAY-63", "PAY-77", "PAY-88"];

export const issueSummary = {
  issuesReviewed: 14,
  duplicateChargesConfirmed: confirmedTransactions.length,
  retryablePayments: [...retryablePayments]
};

export function createEmptyFindings() {
  return {
    issuesReviewed: null,
    duplicatesConfirmed: null,
    retriesResolved: null,
    inspectedDuplicateIds: [],
    retriedIds: []
  };
}

export function applyInvestigationFinding(findings, toolName, payload) {
  const next = {
    issuesReviewed: findings.issuesReviewed,
    duplicatesConfirmed: findings.duplicatesConfirmed,
    retriesResolved: findings.retriesResolved,
    inspectedDuplicateIds: [...(findings.inspectedDuplicateIds || [])],
    retriedIds: [...(findings.retriedIds || [])]
  };

  if (toolName === "inspect_issues" && payload && typeof payload.issuesReviewed === "number") {
    next.issuesReviewed = payload.issuesReviewed;
    if (typeof payload.duplicateChargesConfirmed === "number") {
      next.duplicatesConfirmed = Math.max(next.duplicatesConfirmed || 0, payload.duplicateChargesConfirmed);
    }
  }

  if (toolName === "inspect_transaction" && payload?.id && !payload.error && confirmedTransactions.some((transaction) => transaction.id === payload.id)) {
    if (!next.inspectedDuplicateIds.includes(payload.id)) next.inspectedDuplicateIds.push(payload.id);
    next.duplicatesConfirmed = Math.max(next.duplicatesConfirmed || 0, next.inspectedDuplicateIds.length);
  }

  if (toolName === "retry_payment" && payload?.ok && typeof payload.id === "string") {
    if (!next.retriedIds.includes(payload.id)) next.retriedIds.push(payload.id);
    next.retriesResolved = next.retriedIds.length;
  }

  return next;
}

export const defaultCapabilityRequest = {
  capability: "refund_scoped_transactions",
  scope: {
    transactions: confirmedTransactions.map(({ id }) => id),
    maxAmount: 184
  },
  reason: "Three duplicate charges were confirmed through transaction inspection."
};

export function validateCapabilityRequest(input) {
  const allowedIds = new Set(confirmedTransactions.map(({ id }) => id));
  const transactions = input?.scope?.transactions;
  const maxAmount = input?.scope?.maxAmount;
  const violations = [];

  if (input?.capability !== "refund_scoped_transactions") violations.push("UNSUPPORTED_CAPABILITY");
  if (typeof input?.reason !== "string" || input.reason.trim().length === 0) violations.push("REASON_REQUIRED");
  if (!Array.isArray(transactions) || transactions.length === 0) {
    violations.push("TRANSACTIONS_REQUIRED");
  } else {
    if (new Set(transactions).size !== transactions.length) violations.push("DUPLICATE_TRANSACTION");
    if (transactions.some((id) => typeof id !== "string" || !allowedIds.has(id))) violations.push("TRANSACTION_NOT_VERIFIED");
  }
  if (typeof maxAmount !== "number" || !Number.isFinite(maxAmount) || maxAmount <= 0) violations.push("INVALID_MAX_AMOUNT");

  if (violations.length) {
    return {
      ok: false,
      error: {
        code: "INVALID_CAPABILITY_REQUEST",
        message: "Capability request must name a supported action and verified scope.",
        violations
      }
    };
  }

  return {
    ok: true,
    request: {
      capability: input.capability,
      scope: { transactions: [...transactions], maxAmount },
      reason: input.reason.trim()
    }
  };
}

export function retryPayment(input) {
  if (typeof input?.id !== "string" || !retryablePayments.includes(input.id)) {
    return {
      ok: false,
      error: {
        code: "PREAUTHORIZED_POLICY_VIOLATION",
        message: "Only payment failures identified by today's inspection may be retried.",
        allowedPaymentIds: retryablePayments
      }
    };
  }

  return {
    ok: true,
    id: input.id,
    status: "retry_queued",
    policy: { failedPaymentsOnly: true, maxAttempts: 1, idempotent: true }
  };
}

export function planRefunds(grant) {
  const allowedIds = new Set(grant.transactions);
  const requested = confirmedTransactions.filter((transaction) => allowedIds.has(transaction.id));
  return {
    approved: requested.filter((transaction) => transaction.amount <= grant.maxAmount),
    deferred: requested.filter((transaction) => transaction.amount > grant.maxAmount)
  };
}

export function validateRefund(input, grant) {
  const requested = Array.isArray(input?.transactions) ? input.transactions : [];
  if (requested.length === 0) {
    return {
      ok: false,
      error: {
        code: "INVALID_INPUT",
        message: "At least one refund instruction is required."
      }
    };
  }

  const allowedIds = new Set(grant.transactions);
  const seen = new Set();
  const rejected = [];
  for (const item of requested) {
    const transaction = confirmedTransactions.find((candidate) => candidate.id === item?.id);
    const amount = item?.amount;
    const violations = [];
    if (seen.has(item?.id)) violations.push("DUPLICATE_TRANSACTION");
    if (!transaction || !allowedIds.has(item?.id)) violations.push("TRANSACTION_NOT_ALLOWED");
    if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0) violations.push("INVALID_AMOUNT");
    if (Number.isFinite(amount) && amount > grant.maxAmount) violations.push("AMOUNT_OVER_GRANT");
    if (transaction && Number.isFinite(amount) && amount > transaction.amount) violations.push("AMOUNT_OVER_TRANSACTION");
    if (violations.length) rejected.push({ id: item?.id, amount: item?.amount, violations });
    seen.add(item?.id);
  }

  if (rejected.length) {
    return {
      ok: false,
      error: {
        code: "SCOPE_VIOLATION",
        message: "Refund call is outside the temporary authority grant.",
        allowedTransactions: [...grant.transactions],
        maxAmountPerTransaction: grant.maxAmount,
        transactionLimits: Object.fromEntries(confirmedTransactions.filter(({ id }) => allowedIds.has(id)).map((item) => [item.id, item.amount])),
        rejected
      }
    };
  }
  return {
    ok: true,
    refunds: requested.map(({ id, amount }) => ({ id, amount, status: "refunded" })),
    authority: "grant-09:41",
    message: "Refunded within the human-approved scope."
  };
}
