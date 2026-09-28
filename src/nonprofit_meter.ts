import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { z } from "zod";
import { InfraiRequestError, InfraiUsageClient } from "./infrai_usage.js";
import { UsageLedger, usageKinds } from "./usage_ledger.js";

const eventBody = z.object({
  eventId: z.string().min(1),
  customerId: z.string().min(1),
  kind: z.enum(usageKinds),
  units: z.number().int().positive(),
  occurredAt: z.string().datetime().optional(),
}).strict();

const reportBody = z.object({ customerId: z.string().min(1) }).strict();

async function readJson(request: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) chunks.push(Buffer.from(chunk));
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

function reply(response: ServerResponse, status: number, body: unknown): void {
  response.writeHead(status, { "content-type": "application/json" });
  response.end(JSON.stringify(body));
}

export function createNonprofitMeter(
  ledger = new UsageLedger(),
  usageClient = new InfraiUsageClient(process.env.INFRAI_API_KEY),
) {
  return createServer(async (request, response) => {
    try {
      if (request.method === "POST" && request.url === "/usage-events") {
        const input = eventBody.parse(await readJson(request));
        const result = ledger.record({
          ...input,
          occurredAt: input.occurredAt ? new Date(input.occurredAt) : new Date(),
        });
        reply(response, 201, result);
        return;
      }

      if (request.method === "POST" && request.url === "/campaign-report") {
        const input = reportBody.parse(await readJson(request));
        const [customerUsage, accountUsageTimeseries] = await Promise.all([
          ledger.summarize(input.customerId),
          usageClient.timeseries(),
        ]);
        reply(response, 200, { customerUsage, accountUsageTimeseries });
        return;
      }

      reply(response, 404, { error: "route_not_found" });
    } catch (error) {
      if (error instanceof z.ZodError || error instanceof SyntaxError) {
        reply(response, 400, { error: "invalid_request" });
      } else if (error instanceof InfraiRequestError) {
        const status = error.status >= 400 && error.status < 500 ? error.status : 502;
        reply(response, status, { error: error.code, message: error.message });
      } else {
        reply(response, 502, { error: "upstream_request_failed" });
      }
    }
  });
}

if (process.argv[1] && import.meta.url === new URL(process.argv[1], "file:").href) {
  const port = Number(process.env.PORT ?? 3000);
  createNonprofitMeter().listen(port, () => {
    console.log(`Nonprofit usage meter listening on http://localhost:${port}`);
  });
}
