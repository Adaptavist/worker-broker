import { callWorkerFn } from "./callWorkerFn.ts";
import { debug } from "./debug.ts";
import { marshal } from "./marshal.ts";
import { createResult } from "./result.ts";
import { getTelemetry } from "./telemetry.ts";
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
  { data: incomingMsg }: MessageEvent<unknown>,
): Promise<void> => {
  if (isWorkerMsgCall(incomingMsg) && incomingMsg.sourceModule) {
    await getTelemetry().msgSpan("handleMessage", incomingMsg, async () => {
      debug("container received call:", incomingMsg);

      // remove the telemetry context before we forward the call
      // so that further spans pick up the active context rather
      // than the reuse the context from the message
      const { context: _, ...callMsg } = incomingMsg;

      let props: Pick<WorkerMsgResult<Fn>, "result" | "error"> = {};
      try {
        // Call fn in target module
        props = {
          result: await marshal(
            await callWorkerFn(
              callMsg,
              getWorker,
            ),
          ),
        };
      } catch (error: unknown) {
        props = {
          error: await marshal(error),
        };
      }

      const resultMsg = createResult(incomingMsg, props);

      debug("container forwarding result:", resultMsg);

      getWorker(
        new URL(incomingMsg.sourceModule!),
        incomingMsg.sourceSegregationId,
      ).postMessage(
        resultMsg,
      );
    });
  }
};

function isWorkerMsgCall(msg: unknown): msg is WorkerMsgCall {
  return !!msg && typeof msg === "object" && "kind" in msg &&
    msg.kind === "call";
}
