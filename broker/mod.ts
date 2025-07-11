import { workerFnProxy, workerImport, workerProxy } from "../internal/proxy.ts";
import { handleMessage } from "../internal/handleMessage.ts";
import type {
  Fn,
  WorkerBrokerOptions,
  WorkerCleaner,
  WorkerEvent,
  WorkerProxy,
  WorkerProxyFactory,
  WorkerSpecifier,
  WorkerSupplier,
} from "../internal/types.ts";
import { getTelemetry } from "../internal/telemetry.ts";

export type {
  WorkerBrokerOptions,
  WorkerCleaner,
  WorkerSpecifier,
  WorkerSupplier,
} from "../internal/types.ts";

/**
 * Default Worker constructor function.
 */
export const defaultWorkerConstructor: WorkerSupplier = (
  _moduleSpecifier,
  _segregationId,
): Worker => new Worker(getTelemetry().defaultWorkerModule, { type: "module" });

/**
 * Manage a pool of Workers, and communication between the Workers and the
 * main thread.
 */
export class WorkerBroker implements WorkerProxyFactory {
  /**
   * Create a WorkerBroker
   */
  constructor(options: WorkerBrokerOptions = {}) {
    if (options.workerConstructor) {
      this.#workerConstructor = options.workerConstructor;
    }
    if (options.workerCleaner) {
      this.#workerCleaner = options.workerCleaner;
    }
  }

  #workerConstructor: WorkerSupplier = defaultWorkerConstructor;

  #workerCleaner: WorkerCleaner | undefined;

  /**
   * Cache of workers
   */
  #workers = new Map<string, Worker>();

  /**
   * Map of the last cache busting value used for a module URL.
   * These are set as the hash of the module URL when importing the module.
   */
  #cacheBusters = new Map<string, string>();

  /**
   * Get a new or existing worker for the given module.
   * The worker will be cached and reused if the same module is requested again,
   * unless a segregationId is given, in which case a new Worker per module per
   * segregation id is created.
   * The URL hash will be stripped from the module specifier.
   *
   * @param moduleSpecifier must be an absolute URL for the module
   * @param segregationId an optional unique id to segregate a Worker from other
   *        Workers of the same module
   * @return a new or existing Worker for the module
   */
  getWorker = (moduleSpecifier: URL, segregationId?: string): Worker => {
    const key = this.#workerKey(moduleSpecifier, segregationId);
    let type: WorkerEvent["type"] = "get";
    let worker = this.#workers.get(key);
    if (!worker) {
      type = "create";
      worker = this.#createWorker(moduleSpecifier, segregationId);
    }
    this.#workerCleaner?.({
      type,
      worker,
      key,
      moduleSpecifier,
      segregationId,
      broker: this,
    });
    return worker;
  };

  /**
   * Remove a Worker from the pool, and stop listening for messages.
   * This does not terminate the Worker.
   *
   * @param moduleSpecifier must be an absolute URL for the module
   * @param segregationId an optional unique id to segregate a Worker from
   *        other Workers of the same module
   * @return the removed Worker if it existed
   */
  removeWorker = (
    moduleSpecifier: URL,
    segregationId?: string,
  ): Worker | undefined => {
    const key = this.#workerKey(moduleSpecifier, segregationId);
    const worker = this.#workers.get(key);

    if (worker) {
      worker.removeEventListener("message", this.#handleMessage);
      this.#workers.delete(key);
      this.#workerCleaner?.({
        type: "remove",
        worker,
        key,
        moduleSpecifier,
        segregationId,
        broker: this,
      });
    }

    return worker;
  };

  /**
   * Create a new worker for the given module, register a message handler and
   * add it to the pool.
   *
   * @param moduleSpecifier must be an absolute URL for the module
   * @param segregationId an optional unique id to segregate a Worker from
   *        other Workers of the same module
   * @returns always a new Worker instance
   */
  #createWorker = (moduleSpecifier: URL, segregationId?: string): Worker => {
    const moduleUrl = stripHash(moduleSpecifier);
    const worker = this.#workerConstructor(
      moduleUrl,
      segregationId,
    );

    this.#workers.set(this.#workerKey(moduleSpecifier, segregationId), worker);

    worker.addEventListener("message", this.#handleMessage);

    return worker;
  };

  /**
   * Create a key for use with this.#workers map.
   * It will remove the hash (which may be set for cache busting purposes),
   * and append a segregationId if specified.
   */
  #workerKey = (moduleSpecifier: URL, segregationId?: string): string => {
    const moduleUrl = stripHash(moduleSpecifier);
    return moduleUrl + (segregationId ? ` @${segregationId}` : "");
  };

  /**
   * Common handler for all incoming messages from workers
   */
  #handleMessage = handleMessage(this.getWorker);

  /**
   * Create a proxy object of all functions of the module in the Worker
   */
  workerProxy = <M>(target: WorkerSpecifier): WorkerProxy<M> => {
    return workerProxy(
      undefined,
      this.#cacheBustedSpec(target),
      this.getWorker,
    );
  };

  /**
   * Create a proxy for a single function in the worker
   */
  workerFnProxy = <F extends Fn>(
    target: WorkerSpecifier,
    functionName: string,
  ): (...args: Parameters<F>) => Promise<Awaited<ReturnType<F>>> => {
    return workerFnProxy(
      undefined,
      this.#cacheBustedSpec(target),
      functionName,
      this.getWorker,
    );
  };

  /**
   * Force a Worker to import a module without performing
   * a function call.
   */
  workerImport = (
    target: WorkerSpecifier,
    cacheBuster?: string | number,
  ): Promise<unknown> => {
    if (cacheBuster) {
      this.#cacheBusters.set(stripHash(target).href, String(cacheBuster));
    }
    return workerImport(
      undefined,
      this.#cacheBustedSpec(target),
      this.getWorker,
    );
  };

  #cacheBustedSpec = (target: WorkerSpecifier): WorkerSpecifier => {
    const moduleUrl = stripHash(target);
    const cacheBuster = this.#cacheBusters.get(moduleUrl.href);
    if (cacheBuster) {
      moduleUrl.hash = cacheBuster;
    }
    return [moduleUrl, Array.isArray(target) ? target[1] : undefined];
  };

  /**
   * Terminate all cached workers and clear the cache
   */
  terminate = (): void => {
    this.#workers.forEach((worker) => {
      worker.removeEventListener("message", this.#handleMessage);
      worker.terminate();
    });
    this.#workers.clear();
    this.#workerCleaner?.({ type: "terminate", broker: this });
  };
}

function stripHash(target: WorkerSpecifier): URL {
  const url = new URL(Array.isArray(target) ? target[0] : target);
  url.hash = "";
  return url;
}
