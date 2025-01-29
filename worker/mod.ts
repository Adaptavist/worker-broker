import { workerFnProxy, workerProxy } from "../internal/proxy.ts";
import type {
  Fn,
  WorkerProxy,
  WorkerProxyFactory,
  WorkerSpecifier,
} from "../internal/types.ts";
import { getSpecifier } from "../internal/workerSpecifier.ts";

export type {
  Fn,
  WorkerProxy,
  WorkerProxyFactory,
  WorkerSpecifier,
} from "../internal/types.ts";

/**
 * Create a proxy to the WorkerBroker, from which a Worker can
 * create function or module proxies to other Workers.
 *
 * @returns a minimal WorkerBroker like object
 */
export function brokerProxy(): WorkerProxyFactory {
  return {
    /**
     * Create a proxy object of all functions of the module in the Worker
     */
    workerProxy<M>(target: WorkerSpecifier): WorkerProxy<M> {
      return workerProxy(getSpecifier(), target);
    },

    /**
     * Create a proxy for a single function in the worker
     */
    workerFnProxy<F extends Fn>(
      target: WorkerSpecifier,
      functionName: string,
    ): (...args: Parameters<F>) => Promise<Awaited<ReturnType<F>>> {
      return workerFnProxy(
        getSpecifier(),
        target,
        functionName,
      );
    },
  };
}
