import { callWorkerFn } from "./callWorkerFn.ts";
import type {
  Fn,
  WorkerMsgCall,
  WorkerProxy,
  WorkerSpecifier,
  WorkerSupplier,
} from "./types.ts";

declare const self: Worker;

/**
 * Create a proxy for a single function in the worker.
 * The worker is fetched only when required.
 */
export function workerFnProxy<F extends Fn>(
  source: WorkerSpecifier | undefined,
  target: WorkerSpecifier,
  functionName: string,
  getWorker: WorkerSupplier = () => self,
): (...args: Parameters<F>) => Promise<Awaited<ReturnType<F>>> {
  const msgTemplate = routing(source, target);

  return (...args) =>
    callWorkerFn<F>({
      kind: "call",
      id: crypto.randomUUID(),
      ...msgTemplate,
      functionName,
      args,
    }, getWorker);
}

/**
 * Create a proxy object of all functions of the module in the Worker
 * The worker is fetched only when required.
 */
export function workerProxy<M>(
  source: WorkerSpecifier | undefined,
  target: WorkerSpecifier,
  getWorker: WorkerSupplier = () => self,
): WorkerProxy<M> {
  // deno-lint-ignore no-explicit-any
  return new Proxy({} as any, {
    get: (obj, functionName) => {
      if (typeof functionName === "string") {
        let fn = obj[functionName];
        if (!fn) {
          fn = workerFnProxy(source, target, functionName, getWorker);
          obj[functionName] = fn;
        }
        return fn;
      }
    },
  });
}

/**
 * Create a function that forces the Worker to import a module
 * without calling a function.
 */
export function workerImport(
  source: WorkerSpecifier | undefined,
  target: WorkerSpecifier,
  getWorker: WorkerSupplier = () => self,
): Promise<unknown> {
  return callWorkerFn({
    kind: "call",
    id: crypto.randomUUID(),
    ...routing(source, target),
  }, getWorker);
}

function routing(
  source: WorkerSpecifier | undefined,
  target: WorkerSpecifier,
): Pick<
  WorkerMsgCall,
  | "sourceModule"
  | "sourceSegregationId"
  | "targetModule"
  | "targetSegregationId"
> {
  const [sourceUrl, sourceSegregationId] = Array.isArray(source)
    ? source
    : [source];
  const [targetUrl, targetSegregationId] = Array.isArray(target)
    ? target
    : [target];
  const sourceModule = sourceUrl?.toString();
  const targetModule =
    (typeof targetUrl === "string"
      ? new URL(targetUrl, sourceModule)
      : targetUrl).href;

  return {
    sourceModule,
    sourceSegregationId,
    targetModule,
    targetSegregationId,
  };
}
