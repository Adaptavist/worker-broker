import type { Fn, WorkerMsgCall, WorkerMsgResult } from './types.ts';
import { debug } from './debug.ts';

declare const self: Worker;

export const callWorkerFn = <F extends Fn>(
    msg: WorkerMsgCall<F>,
    worker: Worker = self,
): Promise<ReturnType<F>> =>
    new Promise((resolve, reject) => {
        const proxyType = worker === self ? 'worker' : 'container';

        const messageHandler = ({ data }: MessageEvent<WorkerMsgResult<F>>) => {
            if (data.kind === 'result' && data.id === msg.id) {
                debug(`${proxyType} proxy received result:`, data);

                worker.removeEventListener('message', messageHandler);

                if (data.error) {
                    reject(data.error);
                } else {
                    resolve(data.result ?? undefined!);
                }
            }
        };

        worker.addEventListener('message', messageHandler);

        debug(`${proxyType} proxy sending call:`, msg);

        worker.postMessage(msg);
    });
