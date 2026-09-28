export const usageKinds = [
  "donor_receipt",
  "volunteer_reminder",
  "campaign_report",
] as const;

export type UsageKind = (typeof usageKinds)[number];

export type UsageEvent = {
  eventId: string;
  customerId: string;
  kind: UsageKind;
  units: number;
  occurredAt: Date;
};

export type CustomerUsage = {
  customerId: string;
  totalUnits: number;
  byKind: Record<UsageKind, number>;
};

export class UsageLedger {
  readonly #events = new Map<string, UsageEvent>();

  record(event: UsageEvent): CustomerUsage {
    if (!this.#events.has(event.eventId)) this.#events.set(event.eventId, event);
    return this.summarize(event.customerId);
  }

  summarize(customerId: string): CustomerUsage {
    const byKind: Record<UsageKind, number> = {
      donor_receipt: 0,
      volunteer_reminder: 0,
      campaign_report: 0,
    };

    for (const event of this.#events.values()) {
      if (event.customerId === customerId) byKind[event.kind] += event.units;
    }

    return {
      customerId,
      totalUnits: Object.values(byKind).reduce((sum, units) => sum + units, 0),
      byKind,
    };
  }
}
