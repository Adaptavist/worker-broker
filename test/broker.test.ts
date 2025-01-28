import {
  assertEquals,
  assertExists,
  assertInstanceOf,
  assertNotStrictEquals,
  assertRejects,
  assertStrictEquals,
} from "@std/assert";
import { WorkerBroker } from "@jollytoad/worker-broker/broker";
import { enableDebugging } from "@jollytoad/worker-broker/debug";
import type * as Gubbins from "./workers/gubbins.ts";
import type * as Gateway from "./workers/gateway.ts";
import type * as Stateful from "./workers/stateful.ts";
import type * as Responses from "./workers/responses.ts";
import type { getWelcome } from "./workers/other.ts";

enableDebugging(true);

Deno.test("worker function proxy", async () => {
  const broker = new WorkerBroker();

  const hello = broker.workerFnProxy<typeof getWelcome>(
    new URL("./workers/other.ts", import.meta.url),
    "getWelcome",
  );
  const result = await hello("World");

  assertEquals(result, "Hello World");
});

Deno.test("a pair of workers", async () => {
  const broker = new WorkerBroker();
  const gubbins = broker.workerProxy<typeof Gubbins>(
    new URL("./workers/gubbins.ts", import.meta.url),
  );

  assertEquals(await gubbins.hello("World"), "Hello World");

  broker.terminate();
});

Deno.test("gateway", async () => {
  const broker = new WorkerBroker();
  const gateway = broker.workerProxy<typeof Gateway>(
    new URL("./workers/gateway.ts", import.meta.url),
  );

  const response = await gateway.sendMessage("Hello World");
  const body = await response.text();

  assertExists(body);

  broker.terminate();
});

Deno.test("error", async () => {
  const broker = new WorkerBroker();
  const gubbins = broker.workerProxy<typeof Gubbins>(
    new URL("./workers/gubbins.ts", import.meta.url),
  );

  await assertRejects(async () => {
    await gubbins.bad();
  });

  broker.terminate();
});

Deno.test("undefined result", async () => {
  const broker = new WorkerBroker();
  const gubbins = broker.workerProxy<typeof Gubbins>(
    new URL("./workers/gubbins.ts", import.meta.url),
  );

  assertStrictEquals(await gubbins.nothing(), undefined);

  broker.terminate();
});

Deno.test("shared worker", async () => {
  const broker = new WorkerBroker();

  const statefulModule = new URL("./workers/stateful.ts", import.meta.url);

  const stateful1 = broker.workerProxy<typeof Stateful>(statefulModule);
  const stateful2 = broker.workerProxy<typeof Stateful>(statefulModule);

  await stateful1.setState("THIS");
  await stateful2.setState("THAT");

  assertEquals(await stateful1.getState(), "THAT");
  assertEquals(await stateful2.getState(), "THAT");

  assertStrictEquals(
    broker.getWorker(statefulModule),
    broker.getWorker(statefulModule),
    "Expected the Workers to be the same",
  );

  broker.terminate();
});

Deno.test("segregated workers", async () => {
  const broker = new WorkerBroker();

  const statefulModule = new URL("./workers/stateful.ts", import.meta.url);

  const stateful1 = broker.workerProxy<typeof Stateful>(statefulModule, "A");
  const stateful2 = broker.workerProxy<typeof Stateful>(statefulModule, "B");

  await stateful1.setState("THIS");
  await stateful2.setState("THAT");

  assertEquals(await stateful1.getState(), "THIS");
  assertEquals(await stateful2.getState(), "THAT");

  assertNotStrictEquals(
    broker.getWorker(statefulModule, "A"),
    broker.getWorker(statefulModule, "B"),
    "Expected the Workers to be different",
  );

  assertNotStrictEquals(
    broker.getWorker(statefulModule),
    broker.getWorker(statefulModule, "A"),
    "Expected the Workers to be different",
  );

  broker.terminate();
});

Deno.test("cache busting", async () => {
  const broker = new WorkerBroker();

  const statefulModule = new URL("./workers/stateful.ts", import.meta.url);

  const statefulWorker1 = broker.getWorker(statefulModule);

  const stateful1 = broker.workerProxy<typeof Stateful>(statefulModule);

  await stateful1.setState("THIS");

  assertEquals(await stateful1.getState(), "THIS");

  // Force reload of module by passing a new cache busting value
  await broker.workerImport(statefulModule, undefined, Date.now());

  const statefulWorker2 = broker.getWorker(statefulModule);

  // Get a new proxy of the same worker & module URL (not segregated)
  const stateful2 = broker.workerProxy<typeof Stateful>(statefulModule);

  assertEquals(await stateful2.getState(), "");

  assertStrictEquals(
    statefulWorker2,
    statefulWorker1,
    "Expected the Worker to remain the same",
  );

  broker.terminate();
});

const thrownResponseTest = (module: string) => async () => {
  const broker = new WorkerBroker();
  const responses = broker.workerProxy<typeof Responses>(
    new URL(module, import.meta.url),
  );

  const response = await assertRejects(async () => {
    return await responses.throwForbidden();
  });

  assertInstanceOf(response, Response);

  if (response instanceof Response) {
    assertEquals(response.status, 403);
  }

  broker.terminate();
};

Deno.test("thrown response", thrownResponseTest("./workers/responses.ts"));
Deno.test(
  "thrown response (proxied)",
  thrownResponseTest("./workers/proxy_responses.ts"),
);

const returnedResponseTest = (module: string) => async () => {
  const broker = new WorkerBroker();
  const responses = broker.workerProxy<typeof Responses>(
    new URL(module, import.meta.url),
  );

  const response = await responses.returnForbidden();

  assertInstanceOf(response, Response);
  assertEquals(response.status, 403);

  broker.terminate();
};

Deno.test("returned response", returnedResponseTest("./workers/responses.ts"));
Deno.test(
  "returned response (proxied)",
  returnedResponseTest("./workers/proxy_responses.ts"),
);

// Deno.test('iterables', async () => {
//     const broker = new WorkerBroker()
//     const gubbins = broker.workerProxy<typeof Gubbins>(new URL('./workers/gubbins.ts', import.meta.url))

//     const things = await gubbins.things()

//     console.log(things)

//     broker.terminate()
// })
