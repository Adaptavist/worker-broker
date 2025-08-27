/// <reference lib="deno.worker" />
import { onmessage } from "@adaptavist/worker-broker/onmessage";
import {
  afterCall,
  beforeCall,
  initialCall,
  lockdown,
} from "./init_untrusted_worker.ts";

self.onmessage = onmessage({ initialCall, beforeCall, afterCall });

lockdown(self);
