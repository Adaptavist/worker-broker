import { workerFnProxy, workerProxy } from "../internal/proxy.ts";
import type { Fn, WorkerProxy, WorkerProxyFactory } from "../internal/types.ts";

export type { Fn, WorkerProxy, WorkerProxyFactory } from "../internal/types.ts";

/**
 * Create a proxy to the WorkerBroker, from which a Worker can
 * create function or module proxies to other Workers.
 *
 * @param sourceModule should always be `import.meta.url`
 * @returns a minimal WorkerBroker like object
 */
export function brokerProxy(sourceModule: string): WorkerProxyFactory {
  return {
    /**
     * Create a proxy object of all functions of the module in the Worker
     */
    workerProxy: <M>(
      targetModule: URL | string,
      segregationId?: string,
    ): WorkerProxy<M> => {
      return workerProxy(sourceModule, segregationId)(targetModule);
    },

    /**
     * Create a proxy for a single function in the worker
     */
    workerFnProxy: <F extends Fn>(
      targetModule: URL | string,
      functionName: string,
      segregationId?: string,
    ): (...args: Parameters<F>) => Promise<Awaited<ReturnType<F>>> => {
      return workerFnProxy(sourceModule, segregationId)(
        targetModule,
        functionName,
      );
    },
  };
}
