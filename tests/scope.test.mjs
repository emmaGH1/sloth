import test from "node:test";
import assert from "node:assert/strict";
import { planRefunds, validateRefund } from "../scope.js";

test("allows the three specifically approved duplicate refunds", () => {
  const result = validateRefund({ transactions: [{ id: "TX-48", amount: 48 }, { id: "TX-72", amount: 72 }, { id: "TX-184", amount: 184 }] }, 184);
  assert.equal(result.ok, true);
  assert.equal(result.refunds.length, 3);
});

test("rejects an unapproved transaction with a structured scope error", () => {
  const result = validateRefund({ transactions: [{ id: "TX-999", amount: 220 }] }, 184);
  assert.equal(result.ok, false);
  assert.equal(result.error.code, "SCOPE_VIOLATION");
  assert.deepEqual(result.error.allowedTransactions, ["TX-48", "TX-72", "TX-184"]);
  assert.equal(result.error.rejected.length, 1);
  assert.deepEqual(result.error.rejected[0].violations, ["TRANSACTION_NOT_ALLOWED", "AMOUNT_OVER_GRANT"]);
});

test("rejects an approved transaction when its amount exceeds the human limit", () => {
  const result = validateRefund({ transactions: [{ id: "TX-184", amount: 184 }] }, 72);
  assert.equal(result.ok, false);
  assert.equal(result.error.maxAmountPerTransaction, 72);
});

test("rejects empty batches", () => {
  const result = validateRefund({ transactions: [] }, 184);
  assert.equal(result.ok, false);
  assert.equal(result.error.code, "INVALID_INPUT");
});

test("rejects duplicate transaction IDs to prevent double refunds", () => {
  const result = validateRefund({ transactions: [{ id: "TX-48", amount: 48 }, { id: "TX-48", amount: 48 }] }, 184);
  assert.equal(result.ok, false);
  assert.deepEqual(result.error.rejected[0].violations, ["DUPLICATE_TRANSACTION"]);
});

test("rejects non-positive amounts and refunds over the original charge", () => {
  const zero = validateRefund({ transactions: [{ id: "TX-48", amount: 0 }] }, 184);
  const excessive = validateRefund({ transactions: [{ id: "TX-48", amount: 72 }] }, 184);
  assert.equal(zero.ok, false);
  assert.deepEqual(zero.error.rejected[0].violations, ["INVALID_AMOUNT"]);
  assert.equal(excessive.ok, false);
  assert.deepEqual(excessive.error.rejected[0].violations, ["AMOUNT_OVER_TRANSACTION"]);
});

test("rejects numeric strings and non-finite amounts", () => {
  const stringAmount = validateRefund({ transactions: [{ id: "TX-48", amount: "48" }] }, 184);
  const infiniteAmount = validateRefund({ transactions: [{ id: "TX-48", amount: Infinity }] }, 184);
  assert.deepEqual(stringAmount.error.rejected[0].violations, ["INVALID_AMOUNT"]);
  assert.deepEqual(infiniteAmount.error.rejected[0].violations, ["INVALID_AMOUNT"]);
});

test("plans only refunds covered by an adjusted authority cap", () => {
  const plan = planRefunds(72);
  assert.deepEqual(plan.approved.map(({ id }) => id), ["TX-48", "TX-72"]);
  assert.deepEqual(plan.deferred.map(({ id }) => id), ["TX-184"]);
});
