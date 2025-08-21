/// <reference lib="deno.worker" />
import { onmessage } from "./onmessage.ts";
import { openTelemetry } from "./opentelemetry.ts";
import { setTelemetry } from "./telemetry.ts";

setTelemetry(openTelemetry());

/**
 * This is the entry module for every worker.
 *
 * It simply waits for function call messages, and will dynamically
 * import the target module when the first fn call msg is received.
 */
self.onmessage = onmessage();
