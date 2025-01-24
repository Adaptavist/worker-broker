import {
  defaultWorkerModule,
  WorkerBroker,
  type WorkerSupplier,
} from "@jollytoad/worker-broker/broker";

export default new WorkerBroker({
  workerConstructor: (moduleSpecifier, segregationId) => {
    const pathname = moduleSpecifier.pathname;

    if (pathname.includes("/workers/untrusted/")) {
      return createUntrustedWorker(moduleSpecifier, segregationId);
    } else if (pathname.includes("/workers/trusted/")) {
      return createTrustedWorker(moduleSpecifier);
    }

    throw new Error(
      `Attempt to create Worker from invalid module location: ${moduleSpecifier}`,
    );
  },
});

/**
 * Create a Worker for running UNTRUSTED user modules.
 * The Worker will have locked down permissions and global environment,
 * and may override certain global APIs such as fetch, to forward all
 * requests via the `fetch_proxy` worker.
 */
const createUntrustedWorker: WorkerSupplier = (
  moduleSpecifier,
  segregationId,
) => {
  console.log(
    "Creating UNTRUSTED worker:",
    moduleSpecifier.href,
    segregationId,
  );

  return new Worker(import.meta.resolve("./untrusted_worker.ts"), {
    type: "module",
  });
};

/**
 * Create a Worker for our own trusted modules, with less restrictions.
 */
const createTrustedWorker: WorkerSupplier = (
  moduleSpecifier,
  segregationId,
) => {
  console.log("Creating trusted worker:", moduleSpecifier.href, segregationId);

  return new Worker(defaultWorkerModule, { type: "module" });
};
