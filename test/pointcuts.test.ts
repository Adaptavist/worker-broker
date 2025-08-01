import { WorkerBroker } from "@jollytoad/worker-broker/broker";
import { enableDebugging } from "@jollytoad/worker-broker/debug";
import { assertEquals } from "@std/assert";
import type { getWelcome } from "./workers/other.ts";

enableDebugging(false);

Deno.test("advice functions are called", async () => {
  const messages: string[] = [];

  const broker = new WorkerBroker({
    workerConstructor: () => {
      const worker = new Worker(import.meta.resolve("./worker_pointcuts.ts"), {
        type: "module",
      });

      worker.addEventListener("message", (event) => {
        if (typeof event.data === "string") {
          messages.push(event.data);
        }
      });

      return worker;
    },
  });

  await doWorkerFnCall(broker);
  await doWorkerFnCall(broker);

  assertEquals(messages, [
    "initialCall",
    "beforeCall",
    "afterCall",
    "beforeCall",
    "afterCall",
  ]);
});

async function doWorkerFnCall(broker: WorkerBroker) {
  const hello = broker.workerFnProxy<typeof getWelcome>(
    new URL("./workers/other.ts", import.meta.url),
    "getWelcome",
  );
  const result = await hello("World");

  assertEquals(result, "Hello World");
}
