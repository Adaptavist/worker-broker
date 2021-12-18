import { assertEquals } from 'https://deno.land/std@0.118.0/testing/asserts.ts';
import { WorkerBroker } from '../src/broker.ts';
import type * as Gubbins from './workers/gubbins.ts';

Deno.test('a pair of workers', async () => {
    const broker = new WorkerBroker();
    const gubbins = broker.workerProxy<typeof Gubbins>(
        new URL('./workers/gubbins.ts', import.meta.url),
    );

    assertEquals(await gubbins.hello('World'), 'Hello World');

    broker.terminate();
});

// Deno.test('iterables', async () => {
//     const broker = new WorkerBroker()
//     const gubbins = broker.workerProxy<typeof Gubbins>(new URL('./workers/gubbins.ts', import.meta.url))

//     const things = await gubbins.things()

//     console.log(things)

//     broker.terminate()
// })
