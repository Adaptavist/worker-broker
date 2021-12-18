import { callWorkerFn } from './call.ts';
import type { Fn } from './types.ts';

declare const self: Worker;

export const workerFnProxy = (sourceModule: string) =>
    <F extends Fn>(
        moduleSpecifier: URL | string,
        functionName: string,
        worker: Worker = self,
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
        }, worker);

export const workerProxy = (sourceModule: string) =>
    <M>(moduleSpecifier: URL | string, worker: Worker = self): M =>
        // deno-lint-ignore no-explicit-any
        new Proxy({} as any, {
            get: (target, functionName) => {
                if (typeof functionName === 'string') {
                    let fn = target[functionName];
                    if (!fn) {
                        fn = workerFnProxy(sourceModule)(
                            moduleSpecifier,
                            functionName,
                            worker,
                        );
                        target[functionName] = fn;
                    }
                    return fn;
                }
            },
        });
