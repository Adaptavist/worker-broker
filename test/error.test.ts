import { WorkerBroker } from "@adaptavist/worker-broker/broker";
import { enableDebugging } from "@adaptavist/worker-broker/debug";
import { assertEquals, assertRejects } from "@std/assert";
import type { throwError } from "./workers/error.ts";

enableDebugging(false);

Deno.test("error handler can return a result", async () => {
  const broker = new WorkerBroker({
    workerConstructor: () => {
      const worker = new Worker(
        import.meta.resolve("./worker_error_return.ts"),
        {
          type: "module",
        },
      );

      return worker;
    },
  });

  const throwErrorFn = broker.workerFnProxy<typeof throwError>(
    new URL("./workers/error.ts", import.meta.url),
    "throwError",
  );
  const result = await throwErrorFn();

  assertEquals(result.error?.message, "Something went wrong");
});

Deno.test("error handler can propagate the error", async () => {
  const broker = new WorkerBroker({
    workerConstructor: () => {
      const worker = new Worker(
        import.meta.resolve("./worker_error_propagate.ts"),
        {
          type: "module",
        },
      );

      return worker;
    },
  });

  const throwErrorFn = broker.workerFnProxy<typeof throwError>(
    new URL("./workers/error.ts", import.meta.url),
    "throwError",
  );

  await assertRejects(
    async () => {
      await throwErrorFn();
    },
    Error,
    "Something went wrong",
  );
});
