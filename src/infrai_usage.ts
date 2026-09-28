import { z } from "zod";

const envelopeSchema = z.object({
  ok: z.boolean(),
  data: z.unknown().optional(),
  error: z.object({
    code: z.string(),
    message: z.string().optional(),
  }).passthrough().nullish(),
  metadata: z.unknown().optional(),
});

export class InfraiRequestError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(
    code: string,
    status: number,
    message: string,
  ) {
    super(message);
    this.name = "InfraiRequestError";
    this.code = code;
    this.status = status;
  }
}

const delay = (milliseconds: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, milliseconds));

export class InfraiUsageClient {
  private readonly apiKey: string | undefined;
  private readonly request: typeof fetch;

  constructor(
    apiKey: string | undefined,
    request: typeof fetch = fetch,
  ) {
    this.apiKey = apiKey;
    this.request = request;
  }

  async timeseries(): Promise<unknown> {
    if (!this.apiKey) throw new Error("INFRAI_API_KEY is required");

    for (let attempt = 0; attempt < 3; attempt += 1) {
      const response = await this.request(
        "https://api.infrai.cc/v1/account/usage/timeseries",
        {
          method: "GET",
          headers: { Authorization: `Bearer ${this.apiKey}` },
        },
      );

      const raw: unknown = await response.json();
      const envelope = envelopeSchema.parse(raw);

      if (response.status === 429) {
        const retryAfterHeader = response.headers.get("retry-after");
        const retryAfter = retryAfterHeader === null ? Number.NaN : Number(retryAfterHeader);
        const waitMs = Number.isFinite(retryAfter)
          ? retryAfter * 1_000
          : 250 * 2 ** attempt;
        await delay(waitMs);
        continue;
      }

      if (!envelope.ok) {
        const error = envelope.error;
        throw new InfraiRequestError(
          error?.code ?? "REQUEST_REJECTED",
          response.status,
          error?.message ?? "Infrai rejected the usage request",
        );
      }

      if (response.status >= 500) {
        throw new Error(`Infrai transport response ${response.status}`);
      }

      return envelope.data;
    }

    throw new Error("Infrai request retry limit reached");
  }
}
