import { callWorkerFn } from "./callWorkerFn.ts";
import { debug } from "./debug.ts";
import { marshal } from "./marshal.ts";
import { getTelemetry } from "@jollytoad/worker-broker/telemetry";
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
  { data: incomingMsg }: MessageEvent<WorkerMsgCall<Fn>>,
): Promise<void> => {
  if (incomingMsg.kind === "call" && incomingMsg.sourceModule) {
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

      const resultMsg: WorkerMsgResult<Fn> = {
        ...incomingMsg,
        kind: "result",
        ...props,
      };

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
