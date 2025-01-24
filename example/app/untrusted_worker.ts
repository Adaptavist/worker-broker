/// <reference no-default-lib="true" />
/// <reference lib="deno.worker" />

import { onmessage } from "@jollytoad/worker-broker/onmessage";
import type { WorkerMsgCall } from "@jollytoad/worker-broker/types";
import { workerProxy } from "@jollytoad/worker-broker/worker";
import type * as FetchProxy from "../workers/trusted/fetch_proxy.ts";

function init(msg: WorkerMsgCall) {
  const proxy = workerProxy(msg.targetModule);
  const { fetch } = proxy<typeof FetchProxy>(
    new URL("../workers/trusted/fetch_proxy.ts", import.meta.url),
  );

  globalThis.fetch = fetch;

  Object.defineProperty(globalThis, "fetch", {
    configurable: false,
    writable: false,
  });
}

self.onmessage = onmessage(init);

/**
 * This is the entry module for untrusted 'user' scripts.
 */
Object.defineProperty(self, "onmessage", {
  configurable: false,
  writable: false,
});
