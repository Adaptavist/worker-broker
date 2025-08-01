import { onmessage } from "@jollytoad/worker-broker/onmessage";
import { openTelemetry } from "@jollytoad/worker-broker/opentelemetry";
import { setTelemetry } from "@jollytoad/worker-broker/telemetry";
import {
  afterCall,
  beforeCall,
  initialCall,
  lockdown,
} from "./init_untrusted_worker.ts";

declare const self: Worker;

setTelemetry(openTelemetry());

self.onmessage = onmessage({ initialCall, beforeCall, afterCall });

lockdown(self);
