import type {
  Fn,
  WorkerMsgCall,
  WorkerMsgResult,
  WorkerSupplier,
} from "./types.ts";
import { findTransferables } from "./transfer.ts";
import { marshalArgs, unmarshal } from "./marshal.ts";
import { getTelemetry } from "./telemetry.ts";

declare const self: Worker;

/**
 * Call a function in a Worker (that was created by the WorkerBroker)
 */
export const callWorkerFn = <F extends Fn>(
  msg: WorkerMsgCall<F>,
  getWorker: WorkerSupplier = () => self,
): Promise<Awaited<ReturnType<F>>> => {
  const { msgSpan, marshalContext } = getTelemetry();

  return msgSpan("callWorkerFn", msg, (log) => {
    const worker = getWorker(
      new URL(msg.targetModule),
      msg.targetSegregationId,
    );

    const { promise, resolve, reject } = Promise.withResolvers<
      Awaited<ReturnType<F>>
    >();

    const messageHandler = async (
      { data }: MessageEvent<WorkerMsgResult<F>>,
    ) => {
      if (data.kind === "result" && data.id === msg.id) {
        log.event("result");

        worker.removeEventListener("message", messageHandler);

        if (data.error) {
          reject(await unmarshal(data.error));
        } else {
          resolve((await unmarshal(data.result)) ?? undefined!);
        }
      }
    };

    worker.addEventListener("message", messageHandler);

    const carrier = marshalContext();

    (async function () {
      const marshalledMsg: MarshalledMsg = {
        ...msg,
        args: msg.args?.length ? await marshalArgs(msg.args) : [],
        context: carrier,
      };

      const transferables = await findTransferables(...marshalledMsg.args);

      log.event("postMessage");

      worker.postMessage(
        marshalledMsg,
        transferables,
      );
    })();

    return promise;
  });
};

type MarshalledMsg = Omit<WorkerMsgCall, "args"> & { args: unknown[] };
