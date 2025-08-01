import { onmessage } from "@jollytoad/worker-broker/onmessage";
import {
  afterCall,
  beforeCall,
  initialCall,
  lockdown,
} from "./init_untrusted_worker.ts";

declare const self: Worker;

self.onmessage = onmessage({ initialCall, beforeCall, afterCall });

lockdown(self);
