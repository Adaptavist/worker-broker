import type { WorkerMsgCall } from '../../worker/mod.ts';

// deno-lint-ignore no-explicit-any
const stores = new Map<string, Map<string, any>>();

export function put<T>(this: unknown, name: string, value: T): T | undefined {
    const msg = this as WorkerMsgCall<typeof get>;

    if (msg.sourceModule) {
        let store = stores.get(msg.sourceModule);
        if (!store) {
            // deno-lint-ignore no-explicit-any
            store = new Map<string, any>();
            stores.set(msg.sourceModule, store);
        }
        store.set(name, value);
        return value;
    }
}

export function get<T>(this: unknown, name: string): T | undefined {
    const msg = this as WorkerMsgCall<typeof get>;

    if (msg.sourceModule) {
        return stores.get(msg.sourceModule)?.get(name);
    }
}
