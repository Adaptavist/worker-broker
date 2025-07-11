import type {
  Telemetry,
  TelemetryContext,
  TelemetryTools,
  WorkerMsg,
} from "./types.ts";
import { type Context, context, propagation, trace } from "@opentelemetry/api";

/**
 * Create the WorkerBroker telemetry support functions for OpenTelemetry.
 *
 * @example
 * ```ts
 * import { setTelemetry } from "@jollytoad/worker-broker/telemetry";
 * import { openTelemetry } from "@jollytoad/worker-broker/opentelemetry";
 *
 * setTelemetry(openTelemetry());
 * ```
 */
export function openTelemetry(): Telemetry {
  return {
    msgSpan,
    marshalContext,
    defaultWorkerModule: import.meta.resolve("./worker_otel.ts"),
  };
}

async function msgSpan<T>(
  spanName: string,
  msg: WorkerMsg,
  fn: (log: TelemetryTools) => Promise<T>,
): Promise<T> {
  await patch();

  const sourceType = msg.sourceModule ? "worker" : "broker";
  const tracer = trace.getTracer(sourceType);

  return tracer.startActiveSpan(
    spanName,
    { attributes: workerMsgAttrs(msg) },
    getContext(msg),
    async (span) => {
      const log: TelemetryTools = {
        event(name: string) {
          span.addEvent(name);
        },
      };
      try {
        return await fn(log);
      } finally {
        span.end();
      }
    },
  );
}

function marshalContext(): TelemetryContext {
  const carrier: Record<string, string> = {};
  propagation.inject(context.active(), carrier);
  return carrier;
}

function workerMsgAttrs(msg: WorkerMsg): Record<string, string | undefined> {
  return {
    "source": msg.sourceModule ? "worker" : "broker",
    "source.mod": msg.sourceModule,
    "source.seg": msg.sourceSegregationId,
    "target.mod": msg.targetModule,
    "target.seg": msg.targetSegregationId,
    "fn": msg.functionName,
  };
}

function getContext(msg: WorkerMsg): Context {
  if (msg.context) {
    return propagation.extract(context.active(), msg.context);
  } else {
    return context.active();
  }
}

async function patch() {
  // @ts-ignore: work-around Deno bug
  if (!globalThis[Symbol.for("opentelemetry.js.api.1")].propagation) {
    const { W3CTraceContextPropagator } = await import(
      "npm:@opentelemetry/core@1"
    );
    // @ts-ignore: work-around Deno bug
    globalThis[Symbol.for("opentelemetry.js.api.1")].propagation =
      new W3CTraceContextPropagator();
  }
}
