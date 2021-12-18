/// <reference no-default-lib="true" />
/// <reference lib="deno.worker" />

import type { Fn, WorkerMsgCall, WorkerMsgResult } from './types.ts';
import { debug } from './debug.ts';

self.onmessage = async <F extends Fn>(
    { data }: MessageEvent<WorkerMsgCall<F>>,
) => {
    if (data.kind === 'call') {
        debug('worker received call:', data);

        let props: Pick<WorkerMsgResult<Fn>, 'result' | 'error'> = {};
        try {
            const m = await import(data.targetModule);

            if (typeof m[data.functionName] === 'function') {
                props = {
                    result: await m[data.functionName](...data.args),
                };
            } else {
                props = {
                    error: 'Function not found',
                };
            }
        } catch (error: unknown) {
            props = { error };
        }

        const msg: WorkerMsgResult<F> = {
            ...data,
            kind: 'result',
            ...props,
        };

        debug('worker sending result:', msg);

        self.postMessage(msg);
    }
};
