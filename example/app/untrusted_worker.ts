import { onmessage } from "@jollytoad/worker-broker/onmessage";
import { brokerProxy } from "@jollytoad/worker-broker/worker";

declare const self: Worker;

/**
 * Initialization for untrusted workers, this is called once and only
 * once within a new Worker immediately before a module is imported.
 *
 * In this particular case we'll be replacing the global `fetch`
 * function to forward it's request to another 'trusted' worker,
 * that logs the request and response status.
 *
 * It also locks down the fetch property itself to ensure that the
 * imported 'untrusted' worker module can no longer tamper with it.
 */
function init() {
  const broker = brokerProxy();
  const fetch = broker.workerFnProxy<typeof globalThis.fetch>(
    new URL("../workers/trusted/fetch_proxy.ts", import.meta.url),
    "fetch",
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
