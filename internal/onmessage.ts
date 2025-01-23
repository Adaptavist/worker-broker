import type { Fn, WorkerMsgCall } from "./types.ts";
import { debug } from "./debug.ts";
import { findTransferables } from "./transfer.ts";
import { importAndCall } from "./importAndCall.ts";

/**
 * Minimal definition of the `self` object within a Worker,
 * as required the `onmessage` function.
 */
export interface WorkerSelf {
  /**
   * Post a message back to the main thread from the Worker.
   */
  // deno-lint-ignore no-explicit-any
  postMessage(message: any, transfer: Transferable[]): void;
}

/**
 * This is a simple an onmessage handler for a worker.
 *
 * It simply waits for function call messages, and will dynamically
 * import the target module when the first fn call msg is received.
 */
export async function onmessage(
  this: WorkerSelf,
  { data }: MessageEvent<WorkerMsgCall<Fn>>,
): Promise<void> {
  if (data.kind === "call") {
    debug("worker received call:", data);

    const msg = await importAndCall(data);

    debug("worker sending result:", msg);

    this.postMessage(msg, findTransferables(msg.result));
  }
}
