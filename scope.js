export const confirmedTransactions = [
  { id: "TX-48", amount: 48, customer: "Arden LLC" },
  { id: "TX-72", amount: 72, customer: "Tay Studio" },
  { id: "TX-184", amount: 184, customer: "Kiteworks" }
];

export function planRefunds(maxAmount) {
  return {
    approved: confirmedTransactions.filter((transaction) => transaction.amount <= maxAmount),
    deferred: confirmedTransactions.filter((transaction) => transaction.amount > maxAmount)
  };
}

export function validateRefund(input, maxAmount) {
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

  const seen = new Set();
  const rejected = [];
  for (const item of requested) {
    const transaction = confirmedTransactions.find((candidate) => candidate.id === item?.id);
    const amount = item?.amount;
    const violations = [];
    if (seen.has(item?.id)) violations.push("DUPLICATE_TRANSACTION");
    if (!transaction) violations.push("TRANSACTION_NOT_ALLOWED");
    if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0) violations.push("INVALID_AMOUNT");
    if (Number.isFinite(amount) && amount > maxAmount) violations.push("AMOUNT_OVER_GRANT");
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
        allowedTransactions: confirmedTransactions.map((item) => item.id),
        maxAmountPerTransaction: maxAmount,
        transactionLimits: Object.fromEntries(confirmedTransactions.map((item) => [item.id, item.amount])),
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
