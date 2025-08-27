/// <reference lib="deno.worker" />
import { onmessage } from "@adaptavist/worker-broker/onmessage";
import type { WorkerMsgCall } from "@adaptavist/worker-broker/types";

function onError(_msg: WorkerMsgCall, error: unknown) {
  console.debug("This error is expected to be return in the result:", error);
  return { error };
}

self.onmessage = onmessage({ onError });
