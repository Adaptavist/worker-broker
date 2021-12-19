import { assertEquals, assertExists, assertRejects, assertThrows } from 'https://deno.land/std@0.118.0/testing/asserts.ts';
import { WorkerBroker } from '../src/broker.ts';
import type * as Gubbins from './workers/gubbins.ts';
import type * as Gateway from './workers/gateway.ts';

Deno.test('a pair of workers', async () => {
    const broker = new WorkerBroker();
    const gubbins = broker.workerProxy<typeof Gubbins>(
        new URL('./workers/gubbins.ts', import.meta.url),
    );

    assertEquals(await gubbins.hello('World'), 'Hello World');

    broker.terminate();
});

Deno.test('gateway', async () => {
    const broker = new WorkerBroker();
    const gateway = broker.workerProxy<typeof Gateway>(
        new URL('./workers/gateway.ts', import.meta.url),
    );

    const response = await gateway.sendMessage('Hello World');
    assertExists(response.reply);

    broker.terminate();
});

Deno.test('error', async () => {
    const broker = new WorkerBroker();
    const gubbins = broker.workerProxy<typeof Gubbins>(
        new URL('./workers/gubbins.ts', import.meta.url),
    );

    await assertRejects(async () => {
        await gubbins.bad()
    });

    broker.terminate();
});


// Deno.test('iterables', async () => {
//     const broker = new WorkerBroker()
//     const gubbins = broker.workerProxy<typeof Gubbins>(new URL('./workers/gubbins.ts', import.meta.url))

//     const things = await gubbins.things()

//     console.log(things)

//     broker.terminate()
// })
