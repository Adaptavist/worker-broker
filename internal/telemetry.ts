import type { Telemetry, TelemetryTools } from "./types.ts";

/**
 * Register the global Telemetry support functions for WorkerBroker.
 * Once set it cannot be changed.
 *
 * @example
 * ```ts
 * import { setTelemetry } from "@adaptavist/worker-broker/telemetry";
 * import { openTelemetry } from "@adaptavist/worker-broker/opentelemetry";
 *
 * setTelemetry(openTelemetry());
 * ```
 */
export function setTelemetry(telemetry: Telemetry): void {
  // deno-lint-ignore no-explicit-any
  (globalThis as any)[Symbol.for("workerbroker.telemetry.1")] ??= telemetry;
}

/**
 * Get the global WorkerBroker telemetry support functions.
 * Will return a set of no-op function if no telemetry support was registered.
 */
export function getTelemetry(): Telemetry {
  // deno-lint-ignore no-explicit-any
  return (globalThis as any)[Symbol.for("workerbroker.telemetry.1")] ??
    noopTelemetry;
}

const noopTools: TelemetryTools = {
  event(_name) {},
};

const noopTelemetry: Telemetry = {
  msgSpan(_spanName, _msg, fn) {
    return fn(noopTools);
  },

  marshalContext() {
    return undefined;
  },

  defaultWorkerModule: import.meta.resolve("./worker.ts"),
};
