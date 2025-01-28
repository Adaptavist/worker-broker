import { callWorkerFn } from "./callWorkerFn.ts";
import { debug } from "./debug.ts";
import { marshal } from "./marshal.ts";
import type {
  Fn,
  WorkerMsgCall,
  WorkerMsgResult,
  WorkerSupplier,
} from "./types.ts";

/**
 * Create a handler for all incoming messages from workers
 */
export const handleMessage = (getWorker: WorkerSupplier) =>
async (
  { data }: MessageEvent<WorkerMsgCall<Fn>>,
) => {
  if (data.kind === "call" && data.sourceModule) {
    debug("container received call:", data);

    let props: Pick<WorkerMsgResult<Fn>, "result" | "error"> = {};
    try {
      // Call fn in target module
      props = {
        result: await marshal(
          await callWorkerFn(
            data,
            getWorker,
          ),
        ),
      };
    } catch (error: unknown) {
      props = {
        error: await marshal(error),
      };
    }

    const msg: WorkerMsgResult<Fn> = {
      ...data,
      kind: "result",
      ...props,
    };

    debug("container forwarding result:", msg);

    getWorker(new URL(data.sourceModule), data.segregationId).postMessage(msg);
  }
};
