import { notFound } from "@http/response/not-found";
import { cascade } from "@http/route/cascade";
import { byPattern } from "@http/route/by-pattern";
import { plainError } from "@http/response/plain-error";
import { ok } from "@http/response/ok";
import type HandlerFn from "../workers/trusted/handler.ts";
import broker from "./broker.ts";

const handlerModuleUrl = new URL(
  "../workers/trusted/handler.ts",
  import.meta.url,
);

export default cascade(
  // Shortcut this to avoid polluting logs with irrelevant requests
  byPattern("/favicon.ico", () => notFound()),
  // Cache busting the module of a Worker is not possible from another worker atm,
  // so this route needs to be here in the main Worker container.
  byPattern("/:moduleName", async (_req, match) => {
    const { moduleName } = match.pathname.groups;
    const targetModule = new URL(
      `../workers/untrusted/${moduleName}.ts`,
      import.meta.url,
    );

    try {
      // Use the WorkerBroker direct to force an import of the module.
      await broker.workerImport(targetModule, undefined, Date.now());
      return ok("Module reloaded");
    } catch (e: unknown) {
      if (e instanceof Response) {
        return e;
      } else if (
        e instanceof Error && e.message.includes("not found")
      ) {
        return notFound();
      } else {
        console.error(`Error importing worker module: "${targetModule}"`, e);
        return plainError(
          500,
          "Internal Server Error",
          e instanceof Error ? e.message : undefined,
        );
      }
    }
  }),
  // Delegate all other requests to the handler Worker
  (req) => {
    return broker.workerFnProxy<typeof HandlerFn>(handlerModuleUrl, "default")(
      req,
    );
  },
);
