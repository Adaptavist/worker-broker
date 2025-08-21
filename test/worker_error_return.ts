/// <reference lib="deno.worker" />
import { onmessage } from "@jollytoad/worker-broker/onmessage";
import type { WorkerMsgCall } from "@jollytoad/worker-broker/types";

function onError(_msg: WorkerMsgCall, error: unknown) {
  console.debug("This error is expected to be return in the result:", error);
  return { error };
}

self.onmessage = onmessage({ onError });
