/// <reference lib="deno.worker" />
import { onmessage } from "@adaptavist/worker-broker/onmessage";
import { openTelemetry } from "@adaptavist/worker-broker/opentelemetry";
import { setTelemetry } from "@adaptavist/worker-broker/telemetry";
import {
  afterCall,
  beforeCall,
  initialCall,
  lockdown,
} from "./init_untrusted_worker.ts";

setTelemetry(openTelemetry());

self.onmessage = onmessage({ initialCall, beforeCall, afterCall });

lockdown(self);
