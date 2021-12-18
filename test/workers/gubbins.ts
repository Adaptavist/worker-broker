/// <reference no-default-lib="true" />
/// <reference lib="deno.worker" />

import { workerProxy } from '../../src/proxy.ts';
import type * as Other from './other.ts';

const proxy = workerProxy(import.meta.url);
const { getWelcome, manyThings, moreThings } = proxy<typeof Other>(
    './other.ts',
);

export async function hello(name: string) {
    const message = await getWelcome(name);
    return message;
}

export async function* things() {
    yield* manyThings();
    yield* moreThings();
}
