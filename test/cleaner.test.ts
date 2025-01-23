import { assertNotStrictEquals, assertStrictEquals } from "@std/assert";
import { WorkerBroker } from "../broker/mod.ts";
import { enableDebugging } from "../internal/debug.ts";
import { cleaner } from "../broker/cleaner.ts";

enableDebugging(true);

Deno.test("limited worker count", () => {
  const broker = new WorkerBroker({
    workerCleaner: cleaner({
      workerCount: 2,
    }),
  });

  const moduleUrl = new URL("./workers/hello.ts", import.meta.url);

  const worker1 = broker.getWorker(moduleUrl, "1");

  assertStrictEquals(broker.getWorker(moduleUrl, "1"), worker1);

  const worker2 = broker.getWorker(moduleUrl, "2");

  assertStrictEquals(broker.getWorker(moduleUrl, "2"), worker2);
  assertStrictEquals(broker.getWorker(moduleUrl, "1"), worker1);

  const worker3 = broker.getWorker(moduleUrl, "3");

  assertStrictEquals(broker.getWorker(moduleUrl, "3"), worker3);
  assertStrictEquals(broker.getWorker(moduleUrl, "2"), worker2);

  // worker1 should have been removed, so attempting to get it
  // again will now result in a new Worker instance

  assertNotStrictEquals(broker.getWorker(moduleUrl, "1"), worker1);

  broker.terminate();
});
