import { callWorkerFn } from './call.ts';
import { debug } from './debug.ts';
import { workerFnProxy, workerProxy } from './proxy.ts';
import type { Fn, WorkerMsgCall, WorkerMsgResult } from './types.ts';

const workerURL = new URL('./worker.ts', import.meta.url);

export class WorkerBroker {
    private workers = new Map<string, Worker>();

    getWorker(moduleSpecifier: string): Worker {
        let worker = this.workers.get(moduleSpecifier);

        if (!worker) {
            worker = this.createWorker(moduleSpecifier);
            this.workers.set(moduleSpecifier, worker);
        }

        return worker;
    }

    handleMessage = async ({ data }: MessageEvent<WorkerMsgCall<Fn>>) => {
        if (data.kind === 'call' && data.sourceModule) {
            debug('container received call:', data);

            let props: Pick<WorkerMsgResult<Fn>, 'result' | 'error'> = {};
            try {
                // Call fn in target module
                props = {
                    result: await callWorkerFn(
                        data,
                        this.getWorker(data.targetModule),
                    ),
                };
            } catch (error: unknown) {
                props = { error };
            }

            const msg: WorkerMsgResult<Fn> = {
                ...data,
                kind: 'result',
                ...props,
            };

            debug('container forwarding result:', msg);

            this.getWorker(data.sourceModule).postMessage(msg);
        }
    };

    createWorker(moduleSpecifier: string): Worker {
        const worker = new Worker(workerURL, { type: 'module' });

        this.workers.set(moduleSpecifier, worker);

        worker.addEventListener('message', this.handleMessage);

        return worker;
    }

    workerProxy<M>(targetModule: URL): M {
        return workerProxy(undefined!)(
            targetModule,
            this.getWorker(targetModule.href),
        );
    }

    workerFnProxy<F extends Fn>(
        targetModule: URL,
        functionName: string,
    ): (...args: Parameters<F>) => Promise<ReturnType<F>> {
        return workerFnProxy(undefined!)(
            targetModule,
            functionName,
            this.getWorker(targetModule.href),
        );
    }

    terminate() {
        this.workers.forEach((worker) => worker.terminate());
        this.workers.clear();
    }
}
