import type { WorkerMsgCall } from "./types.ts";
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
 * Definition of the `onmessage` function.
 */
export type OnMessageFn = (
  this: WorkerSelf,
  event: MessageEvent<WorkerMsgCall>,
) => Promise<void>;

/**
 * Create a an onmessage handler for a worker.
 *
 * It simply waits for function call messages, and will dynamically
 * import the target module when the first fn call msg is received.
 *
 * @param initialize optional function to be called on the first message,
 *   can be used to initialize the global environment within the Worker.
 */
export function onmessage(
  initialize?: (msg: WorkerMsgCall) => void | Promise<void>,
): OnMessageFn {
  console.log("CREATE onmessage");
  let ready = false;
  return async function ({ data }) {
    if (data.kind === "call") {
      debug("worker received call:", data);

      if (!ready && initialize) {
        debug("initializing worker");
        await initialize(data);
        ready = true;
      }

      const msg = await importAndCall(data);

      debug("worker sending result:", msg);

      this.postMessage(msg, await findTransferables(msg.result));
    }
  };
}
