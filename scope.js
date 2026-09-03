export const confirmedTransactions = [
  { id: "TX-48", amount: 48, customer: "Arden LLC" },
  { id: "TX-72", amount: 72, customer: "Tay Studio" },
  { id: "TX-184", amount: 184, customer: "Kiteworks" }
];

export function validateRefund(input, maxAmount) {
  const requested = Array.isArray(input?.transactions) ? input.transactions : [];
  const forbidden = requested.filter((item) => !confirmedTransactions.some((transaction) => transaction.id === item.id));
  const overLimit = requested.filter((item) => Number(item.amount) > maxAmount);
  if (forbidden.length || overLimit.length) {
    return {
      ok: false,
      error: {
        code: "SCOPE_VIOLATION",
        message: "Refund call is outside the temporary authority grant.",
        allowedTransactions: confirmedTransactions.map((item) => item.id),
        maxAmountPerTransaction: maxAmount,
        rejected: [...forbidden, ...overLimit]
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
