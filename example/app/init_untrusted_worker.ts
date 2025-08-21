/// <reference lib="deno.worker" />
import { brokerProxy } from "@jollytoad/worker-broker/worker";
import type { WorkerMsgCall } from "@jollytoad/worker-broker/types";

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
export function initialCall() {
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
 * A function called immediately before the Worker function is called.
 */
export function beforeCall(msg: WorkerMsgCall) {
  console.debug("BEFORE: %s", msg.id);
  performance.mark(`before-${msg.id}`);
}

/**
 * A function called immediately after the Worker function is called.
 */
export function afterCall(msg: WorkerMsgCall) {
  const measure = performance.measure(`call-${msg.id}`, `before-${msg.id}`);
  console.debug("AFTER: %s (%fms)", msg.id, measure.duration);
}

/**
 * A function called when an error is thrown from the Worker function.
 */
export function onError(msg: WorkerMsgCall, error: unknown) {
  console.error("ERROR: %s %o", msg.id, error);
}

/**
 * Lockdown the environment in the untrusted Worker, to prevent
 * unwanted tampering.
 */
export function lockdown(scope: unknown) {
  Object.defineProperty(scope, "onmessage", {
    configurable: false,
    writable: false,
  });
}
