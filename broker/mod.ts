import { callWorkerFn } from "../internal/callWorkerFn.ts";
import { debug } from "../internal/debug.ts";
import { workerFnProxy, workerProxy } from "../internal/proxy.ts";
import type {
  Fn,
  WorkerMsgCall,
  WorkerMsgResult,
  WorkerProxy,
} from "../internal/types.ts";
import { marshal } from "../internal/marshal.ts";

const workerURL = new URL("../internal/worker.ts", import.meta.url);

export class WorkerBroker {
  /**
   * Cache of workers
   */
  #workers = new Map<string, Worker>();

  /**
   * Get a new or existing worker for the given module.
   * The worker will be cached and reused if the same module is requested again.
   *
   * @param moduleSpecifier must be an absolute URL for the module
   * @return a new or existing Worker for the module
   */
  getWorker = (moduleSpecifier: string): Worker => {
    let worker = this.#workers.get(moduleSpecifier);

    if (!worker) {
      worker = this.createWorker(moduleSpecifier);
      this.#workers.set(moduleSpecifier, worker);
    }

    return worker;
  };

  /**
   * Create a new worker for the given module.
   * This is used by getWorker.
   *
   * @param moduleSpecifier must be an absolute URL for the module
   * @returns always a new Worker instance
   */
  createWorker = (moduleSpecifier: string): Worker => {
    const worker = new Worker(workerURL, { type: "module" });

    this.#workers.set(moduleSpecifier, worker);

    worker.addEventListener("message", this.#handleMessage);

    return worker;
  };

  /**
   * Common handler for all incoming messages from workers
   */
  #handleMessage = async (
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
              this.getWorker,
            ),
          ),
        };
      } catch (error: unknown) {
        props = { error };
      }

      const msg: WorkerMsgResult<Fn> = {
        ...data,
        kind: "result",
        ...props,
      };

      debug("container forwarding result:", msg);

      this.getWorker(data.sourceModule).postMessage(msg);
    }
  };

  /**
   * Create a proxy object of all functions of the module in the Worker
   */
  workerProxy = <M>(targetModule: URL): WorkerProxy<M> => {
    return workerProxy(undefined!)(
      targetModule,
      this.getWorker,
    );
  };

  /**
   * Create a proxy for a single function in the worker
   */
  workerFnProxy = <F extends Fn>(
    targetModule: URL,
    functionName: string,
  ): (...args: Parameters<F>) => Promise<ReturnType<F>> => {
    return workerFnProxy(undefined!)(
      targetModule,
      functionName,
      this.getWorker,
    );
  };

  /**
   * Terminate all cached workers and clear the cache
   */
  terminate = (): void => {
    this.#workers.forEach((worker) => worker.terminate());
    this.#workers.clear();
  };
}
