/// <reference no-default-lib="true" />
/// <reference lib="deno.worker" />

import type { Fn, WorkerMsgCall } from "./types.ts";
import { debug } from "./debug.ts";
import { findTransferables } from "./transfer.ts";
import { importAndCall } from "./importAndCall.ts";

/**
 * This is the entry module for every worker.
 *
 * It simply waits for function call messages, and will dynamically
 * import the target module when the first fn call msg is received.
 */
self.onmessage = async <F extends Fn>(
  { data }: MessageEvent<WorkerMsgCall<F>>,
) => {
  if (data.kind === "call") {
    debug("worker received call:", data);

    const msg = await importAndCall(data);

    debug("worker sending result:", msg);

    self.postMessage(msg, findTransferables(msg.result));
  }
};

Object.defineProperty(self, "onmessage", { writable: false });
