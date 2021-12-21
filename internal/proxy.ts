import { callWorkerFn } from './callWorkerFn.ts';
import type { Fn, WorkerProxy, WorkerSupplier } from './types.ts';

declare const self: Worker;

/**
 * Create a proxy for a single function in the worker.
 * The worker is fetched only when required.
 */
export const workerFnProxy = (sourceModule: string) =>
    <F extends Fn>(
        moduleSpecifier: URL | string,
        functionName: string,
        getWorker: WorkerSupplier = () => self,
    ) => (...args: Parameters<F>): Promise<ReturnType<F>> =>
        callWorkerFn<F>({
            kind: 'call',
            id: crypto.randomUUID(),
            sourceModule,
            targetModule: (typeof moduleSpecifier === 'string'
                ? new URL(moduleSpecifier, sourceModule)
                : moduleSpecifier).href,
            functionName,
            args,
        }, getWorker);

/**
 * Create a proxy object of all functions of the module in the Worker
 * The worker is fetched only when required.
 */
export const workerProxy = (sourceModule: string) =>
    <M>(
        moduleSpecifier: URL | string,
        getWorker: WorkerSupplier = () => self,
    ): WorkerProxy<M> =>
        // deno-lint-ignore no-explicit-any
        new Proxy({} as any, {
            get: (target, functionName) => {
                if (typeof functionName === 'string') {
                    let fn = target[functionName];
                    if (!fn) {
                        fn = workerFnProxy(sourceModule)(
                            moduleSpecifier,
                            functionName,
                            getWorker,
                        );
                        target[functionName] = fn;
                    }
                    return fn;
                }
            },
        });
