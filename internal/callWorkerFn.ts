import type {
  Fn,
  WorkerMsgCall,
  WorkerMsgResult,
  WorkerSupplier,
} from "./types.ts";
import { debug } from "./debug.ts";
import { findTransferables } from "./transfer.ts";
import { marshalArgs, unmarshal } from "./marshal.ts";

declare const self: Worker;

/**
 * Call a function in a Worker (that was created by the WorkerBroker)
 */
export const callWorkerFn = <F extends Fn>(
  msg: WorkerMsgCall<F>,
  getWorker: WorkerSupplier = () => self,
): Promise<ReturnType<F>> =>
  new Promise((resolve, reject) => {
    const worker = getWorker(msg.targetModule);

    const proxyType = worker === self ? "worker" : "container";

    const messageHandler = async (
      { data }: MessageEvent<WorkerMsgResult<F>>,
    ) => {
      if (data.kind === "result" && data.id === msg.id) {
        debug(`${proxyType} proxy received result:`, data);

        worker.removeEventListener("message", messageHandler);

        if (data.error) {
          reject(await unmarshal(data.error));
        } else {
          resolve((await unmarshal(data.result)) ?? undefined!);
        }
      }
    };

    worker.addEventListener("message", messageHandler);

    (async function () {
      const marshalledMsg = {
        ...msg,
        args: await marshalArgs(msg.args),
      };

      debug(`${proxyType} proxy sending call:`, marshalledMsg);

      worker.postMessage(
        marshalledMsg,
        findTransferables(...marshalledMsg.args),
      );
    })();
  });
