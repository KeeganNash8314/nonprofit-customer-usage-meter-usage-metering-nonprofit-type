import { UsageLedger } from "./usage_ledger.js";

const ledger = new UsageLedger();

ledger.record({
  eventId: "receipt-batch-2026-09-01",
  customerId: "river-food-bank",
  kind: "donor_receipt",
  units: 24,
  occurredAt: new Date("2026-09-01T10:00:00Z"),
});
ledger.record({
  eventId: "reminder-batch-2026-09-01",
  customerId: "river-food-bank",
  kind: "volunteer_reminder",
  units: 8,
  occurredAt: new Date("2026-09-01T11:00:00Z"),
});
ledger.record({
  eventId: "arts-receipts-2026-09-01",
  customerId: "arts-after-school",
  kind: "donor_receipt",
  units: 5,
  occurredAt: new Date("2026-09-01T12:00:00Z"),
});

console.log(JSON.stringify(ledger.summarize("river-food-bank"), null, 2));
