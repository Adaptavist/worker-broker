import { brokerProxy } from "@jollytoad/worker-broker/worker";

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
export function init() {
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

/**
 * Lockdown the environment in the untrusted Worker, to prevent
 * unwanted tampering.
 */
export function lockdown(worker: Worker) {
  Object.defineProperty(worker, "onmessage", {
    configurable: false,
    writable: false,
  });
}
