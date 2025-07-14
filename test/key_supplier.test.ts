import { assertEquals, assertNotEquals } from "@std/assert";
import { WorkerBroker } from "@jollytoad/worker-broker/broker";
import { enableDebugging } from "@jollytoad/worker-broker/debug";
import type { setState } from "./workers/sibling_one.ts";
import type { getState } from "./workers/sibling_two.ts";

enableDebugging(true);

Deno.test("running multiple modules in a shared worker", async () => {
  const broker = new WorkerBroker({
    workerKeySupplier: () => "common_worker",
  });

  const result = await testSiblingWorkers(broker);

  assertEquals(result, "Hello World");
});

Deno.test("running multiple modules in distinct workers", async () => {
  // This test is to demonstrate what the default behaviour
  // would be when the workerKeySupplier is not passed
  const broker = new WorkerBroker();

  const result = await testSiblingWorkers(broker);

  assertNotEquals(result, "Hello World");
});

async function testSiblingWorkers(broker: WorkerBroker): Promise<string> {
  const setStateProxy = broker.workerFnProxy<typeof setState>(
    new URL("./workers/sibling_one.ts", import.meta.url),
    "setState",
  );

  const getStateProxy = broker.workerFnProxy<typeof getState>(
    new URL("./workers/sibling_two.ts", import.meta.url),
    "getState",
  );

  await setStateProxy("Hello World");

  return await getStateProxy();
}
