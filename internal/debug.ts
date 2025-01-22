let logger: typeof console.debug | undefined = undefined;

/**
 * Log a WorkerBroker debugging message
 */
export function debug(...args: unknown[]) {
  logger?.(...args);
}

/**
 * Enable/disable WorkerBroker debug logging
 * @param enable true or false, or a custom log function
 */
export function enableDebugging(enable: boolean | typeof console.debug) {
  if (typeof enable === "function") {
    logger = enable;
  } else if (enable === true) {
    logger = console.debug;
  } else {
    logger = undefined;
  }
}
