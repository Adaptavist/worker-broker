import {
  WorkerBroker,
  type WorkerSupplier,
} from "@adaptavist/worker-broker/broker";
import { getTelemetry } from "@adaptavist/worker-broker/telemetry";

const untrustedWorkerModule = Deno.env.get("OTEL_DENO") === "true"
  ? import.meta.resolve("./untrusted_worker_otel.ts")
  : import.meta.resolve("./untrusted_worker.ts");

/**
 * Create and export a single common WorkerBroker for use in
 * the main app.
 */
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

const libPathUrl = new URL("../lib/", import.meta.url);

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

  return new Worker(untrustedWorkerModule, {
    type: "module",
    deno: {
      permissions: {
        env: false,
        ffi: false,
        import: "inherit",
        net: false,
        read: [moduleSpecifier, libPathUrl],
        run: false,
        sys: false,
        write: false,
      },
    },
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

  return new Worker(getTelemetry().defaultWorkerModule, { type: "module" });
};
