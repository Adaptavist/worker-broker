import { onmessage } from "@jollytoad/worker-broker/onmessage";
import { openTelemetry } from "@jollytoad/worker-broker/opentelemetry";
import { setTelemetry } from "@jollytoad/worker-broker/telemetry";
import { init, lockdown } from "./init_untrusted_worker.ts";

declare const self: Worker;

setTelemetry(openTelemetry());

self.onmessage = onmessage(init);

lockdown(self);
