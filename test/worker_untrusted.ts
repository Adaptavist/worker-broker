import { onmessage } from "@jollytoad/worker-broker/onmessage";

declare const self: Worker;

function init() {
  // const broker = brokerProxy();

  // const logger = broker.workerFnProxy(
  //   new URL("./trusted_workers/logger.ts", import.meta.url),
  //   "logger"
  // );

  globalThis.console = new Proxy(globalThis.console, {
    get: (original, functionName, receiver) => {
      const ref = Reflect.get(original, functionName, receiver);

      if (typeof ref === "function" && typeof functionName === "string") {
        original.log(`PROXIED console.${functionName}`);
        return (...args: unknown[]) => {
          original.log(`console.${functionName}:`, args);
        };
      } else {
        return ref;
      }
    },
  });
}

/**
 * This is the entry module for untrusted workers.
 */
self.onmessage = onmessage(init);
