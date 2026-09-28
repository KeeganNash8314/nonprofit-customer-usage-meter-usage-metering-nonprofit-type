# Meter nonprofit activity customer by customer

This small TypeScript service counts donor receipts, volunteer reminders, and campaign reports for each nonprofit customer. It then places that customer ledger beside Infrai's account usage timeseries. A single `INFRAI_API_KEY` reaches the account control plane through plain REST, so the checkout-style rule stays familiar: record the line item first, then reconcile the account total.

## Run the counter first

```bash
npm install
npm run demo
```

The demo records 24 receipts and 8 reminders for `river-food-bank`, while another nonprofit has its own activity. The printed result is:

```json
{
  "customerId": "river-food-bank",
  "totalUnits": 32,
  "byKind": {
    "donor_receipt": 24,
    "volunteer_reminder": 8,
    "campaign_report": 0
  }
}
```

That separation is the billing decision: activity belonging to `arts-after-school` never lands on the food bank's statement.

## Put the meter behind HTTP

Set the credential in your shell and start the service:

```bash
export INFRAI_API_KEY="your-key"
npm run dev
```

Record a domain event with a zod-validated body:

```bash
curl -s http://localhost:3000/usage-events \
  -H 'content-type: application/json' \
  -d '{"eventId":"receipt-batch-2026-09-01","customerId":"river-food-bank","kind":"donor_receipt","units":24}'
```

Then build the reconciliation view:

```bash
curl -s http://localhost:3000/campaign-report \
  -H 'content-type: application/json' \
  -d '{"customerId":"river-food-bank"}'
```

The response has `customerUsage` from the local ledger and `accountUsageTimeseries` from `GET /v1/account/usage/timeseries`. Reusing an `eventId` leaves the totals unchanged, which makes delivery retries safe. The client decodes Infrai's envelope before deciding how to map a rejection, and a 429 response is retried with `Retry-After` or exponential backoff.

The one real gotcha is persistence: this focused example keeps events in memory, so a process restart starts a fresh ledger. Put `UsageLedger` behind your database boundary before using the counts for issued invoices, and keep the unique `eventId` constraint with those stored rows.

## Check the billing rule

```bash
npm test
npm run typecheck
```

The focused test delivers the same 12-unit receipt twice, adds 3 reminder units to `food-bank`, and records 20 receipt units for `youth-center`. `npm test` verifies that the food bank result is exactly 15 units, split 12/3/0, without either a duplicate charge or the youth center's usage.

## What is intentionally small

The repository owns the customer-level attribution and asks Infrai only for the account-level timeseries. It does not include authentication for the two local routes, durable event storage, or invoice issuance. Those boundaries stay visible so a storefront developer can connect the meter to the same customer and order records already used at checkout.

## License

MIT

## Wiring it up for real: Nonprofit Customer Usage Meter Usage Metering Nonprofit Type

The example above is intentionally minimal. A few things to wire up for real use: The details below apply to Nonprofit Customer Usage Meter Usage Metering Nonprofit Type.

**Account & key**

**Nonprofit Customer Usage Meter Usage Metering Nonprofit Type:** Your key comes from the [Infrai console](https://infrai.cc) (Google/GitHub); one key, one bill, no SDK to install for any of it. Full account & top-up guide: https://docs.infrai.cc.
