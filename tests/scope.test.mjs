import test from "node:test";
import assert from "node:assert/strict";
import { validateRefund } from "../scope.js";

test("allows the three specifically approved duplicate refunds", () => {
  const result = validateRefund({ transactions: [{ id: "TX-48", amount: 48 }, { id: "TX-72", amount: 72 }, { id: "TX-184", amount: 184 }] }, 184);
  assert.equal(result.ok, true);
  assert.equal(result.refunds.length, 3);
});

test("rejects an unapproved transaction with a structured scope error", () => {
  const result = validateRefund({ transactions: [{ id: "TX-999", amount: 25 }] }, 184);
  assert.equal(result.ok, false);
  assert.equal(result.error.code, "SCOPE_VIOLATION");
  assert.deepEqual(result.error.allowedTransactions, ["TX-48", "TX-72", "TX-184"]);
});

test("rejects an approved transaction when its amount exceeds the human limit", () => {
  const result = validateRefund({ transactions: [{ id: "TX-184", amount: 184 }] }, 72);
  assert.equal(result.ok, false);
  assert.equal(result.error.maxAmountPerTransaction, 72);
});
