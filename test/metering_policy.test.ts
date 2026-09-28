import assert from "node:assert/strict";
import test from "node:test";
import { UsageLedger } from "../src/usage_ledger.js";

test("keeps each nonprofit's billable activity separate by workflow", () => {
  const ledger = new UsageLedger();
  const at = new Date("2026-09-01T10:00:00Z");

  const receipt = { eventId: "receipt-1", customerId: "food-bank", kind: "donor_receipt" as const, units: 12, occurredAt: at };
  ledger.record(receipt);
  ledger.record(receipt);
  ledger.record({ eventId: "reminder-1", customerId: "food-bank", kind: "volunteer_reminder", units: 3, occurredAt: at });
  ledger.record({ eventId: "receipt-2", customerId: "youth-center", kind: "donor_receipt", units: 20, occurredAt: at });

  assert.deepEqual(ledger.summarize("food-bank"), {
    customerId: "food-bank",
    totalUnits: 15,
    byKind: { donor_receipt: 12, volunteer_reminder: 3, campaign_report: 0 },
  });
});
