import { assertEquals } from "@std/assert";
import { WorkerBroker } from "@adaptavist/worker-broker/broker";
import { enableDebugging } from "@adaptavist/worker-broker/debug";
import type * as ClientModule from "./workers/transfer_client.ts";

enableDebugging(false);

Deno.test("transfer", async () => {
  const broker = new WorkerBroker();

  const client = broker.workerFnProxy<typeof ClientModule.client>(
    new URL("./workers/transfer_client.ts", import.meta.url),
    "client",
  );

  const input = [1, 2, 3];
  const expected = [10, 20, 30];

  const result = await client(new Uint8Array(input).buffer, 10);
  const view = [...new Uint8Array(result)];

  assertEquals(view, expected);
});
