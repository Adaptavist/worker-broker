import { marshall, unmarshallArgs } from './marshall.ts';
import type { Fn, WorkerMsgCall, WorkerMsgResult } from './types.ts';

/**
 * Import the target module and call the function
 */
export const importAndCall = async <F extends Fn>(
    msg: WorkerMsgCall<F>,
): Promise<WorkerMsgResult<F>> => {
    let props: Pick<WorkerMsgResult<Fn>, 'result' | 'error'> = {};
    try {
        const m = await import(msg.targetModule);
        const fn = m[msg.functionName];

        if (typeof fn === 'function') {
            const args = await unmarshallArgs(msg.args);

            props = {
                result: await marshall(await fn.apply(msg, args)),
            };
        } else {
            props = {
                error: 'Function not found',
            };
        }
    } catch (error: unknown) {
        props = {
            error: await marshall(error)
        };
    }

    return {
        ...msg,
        kind: 'result',
        ...props,
    };
};
