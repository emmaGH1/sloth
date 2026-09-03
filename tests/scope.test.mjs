import test from "node:test";
import assert from "node:assert/strict";
import { defaultCapabilityRequest, planRefunds, retryPayment, validateCapabilityRequest, validateRefund } from "../scope.js";

const fullGrant = defaultCapabilityRequest.scope;

test("accepts and preserves a valid capability request scope", () => {
  const result = validateCapabilityRequest(defaultCapabilityRequest);
  assert.equal(result.ok, true);
  assert.deepEqual(result.request, defaultCapabilityRequest);
  assert.notEqual(result.request.scope.transactions, defaultCapabilityRequest.scope.transactions);
});

test("rejects unsupported, unverified, duplicate, or unbounded capability requests", () => {
  const result = validateCapabilityRequest({
    capability: "refund_everything",
    scope: { transactions: ["TX-48", "TX-48", "TX-999"], maxAmount: Infinity },
    reason: ""
  });
  assert.equal(result.ok, false);
  assert.equal(result.error.code, "INVALID_CAPABILITY_REQUEST");
  assert.deepEqual(result.error.violations, ["UNSUPPORTED_CAPABILITY", "REASON_REQUIRED", "DUPLICATE_TRANSACTION", "TRANSACTION_NOT_VERIFIED", "INVALID_MAX_AMOUNT"]);
});

test("allows the three specifically approved duplicate refunds", () => {
  const result = validateRefund({ transactions: [{ id: "TX-48", amount: 48 }, { id: "TX-72", amount: 72 }, { id: "TX-184", amount: 184 }] }, fullGrant);
  assert.equal(result.ok, true);
  assert.equal(result.refunds.length, 3);
});

test("rejects an unapproved transaction with a structured scope error", () => {
  const result = validateRefund({ transactions: [{ id: "TX-999", amount: 220 }] }, fullGrant);
  assert.equal(result.ok, false);
  assert.equal(result.error.code, "SCOPE_VIOLATION");
  assert.deepEqual(result.error.allowedTransactions, ["TX-48", "TX-72", "TX-184"]);
  assert.equal(result.error.rejected.length, 1);
  assert.deepEqual(result.error.rejected[0].violations, ["TRANSACTION_NOT_ALLOWED", "AMOUNT_OVER_GRANT"]);
});

test("rejects a verified transaction omitted from the active grant", () => {
  const result = validateRefund({ transactions: [{ id: "TX-184", amount: 72 }] }, { transactions: ["TX-48", "TX-72"], maxAmount: 72 });
  assert.equal(result.ok, false);
  assert.deepEqual(result.error.allowedTransactions, ["TX-48", "TX-72"]);
  assert.deepEqual(result.error.rejected[0].violations, ["TRANSACTION_NOT_ALLOWED"]);
});

test("rejects an approved transaction when its amount exceeds the human limit", () => {
  const result = validateRefund({ transactions: [{ id: "TX-184", amount: 184 }] }, { ...fullGrant, maxAmount: 72 });
  assert.equal(result.ok, false);
  assert.equal(result.error.maxAmountPerTransaction, 72);
});

test("rejects empty batches", () => {
  const result = validateRefund({ transactions: [] }, fullGrant);
  assert.equal(result.ok, false);
  assert.equal(result.error.code, "INVALID_INPUT");
});

test("rejects duplicate transaction IDs to prevent double refunds", () => {
  const result = validateRefund({ transactions: [{ id: "TX-48", amount: 48 }, { id: "TX-48", amount: 48 }] }, fullGrant);
  assert.equal(result.ok, false);
  assert.deepEqual(result.error.rejected[0].violations, ["DUPLICATE_TRANSACTION"]);
});

test("rejects non-positive amounts and refunds over the original charge", () => {
  const zero = validateRefund({ transactions: [{ id: "TX-48", amount: 0 }] }, fullGrant);
  const excessive = validateRefund({ transactions: [{ id: "TX-48", amount: 72 }] }, fullGrant);
  assert.equal(zero.ok, false);
  assert.deepEqual(zero.error.rejected[0].violations, ["INVALID_AMOUNT"]);
  assert.equal(excessive.ok, false);
  assert.deepEqual(excessive.error.rejected[0].violations, ["AMOUNT_OVER_TRANSACTION"]);
});

test("rejects numeric strings and non-finite amounts", () => {
  const stringAmount = validateRefund({ transactions: [{ id: "TX-48", amount: "48" }] }, fullGrant);
  const infiniteAmount = validateRefund({ transactions: [{ id: "TX-48", amount: Infinity }] }, fullGrant);
  assert.deepEqual(stringAmount.error.rejected[0].violations, ["INVALID_AMOUNT"]);
  assert.deepEqual(infiniteAmount.error.rejected[0].violations, ["INVALID_AMOUNT"]);
});

test("plans only refunds covered by an adjusted authority cap", () => {
  const plan = planRefunds({ ...fullGrant, maxAmount: 72 });
  assert.deepEqual(plan.approved.map(({ id }) => id), ["TX-48", "TX-72"]);
  assert.deepEqual(plan.deferred.map(({ id }) => id), ["TX-184"]);
});

test("retry policy accepts inspected failures and rejects arbitrary payments", () => {
  const allowed = retryPayment({ id: "PAY-17" });
  const blocked = retryPayment({ id: "TX-48" });
  assert.equal(allowed.ok, true);
  assert.equal(allowed.policy.maxAttempts, 1);
  assert.equal(blocked.ok, false);
  assert.equal(blocked.error.code, "PREAUTHORIZED_POLICY_VIOLATION");
});
