import { notFound } from "@http/response/not-found";
import { cascade } from "@http/route/cascade";
import { byPattern } from "@http/route/by-pattern";
import { plainError } from "@http/response/plain-error";
import {
  brokerProxy,
  type WorkerSpecifier,
} from "@jollytoad/worker-broker/worker";

export default cascade(
  byPattern("/:moduleName/:functionName", async (_req, match) => {
    const { moduleName, functionName } = match.pathname.groups;
    const { id, ...params } = urlParams(
      new URLSearchParams(match.search.input),
    );

    const targetModule: WorkerSpecifier = [
      new URL(`../untrusted/${moduleName}.ts`, import.meta.url),
      id,
    ];

    try {
      const broker = brokerProxy();
      const fn = broker.workerFnProxy(targetModule, functionName!);
      const result = await fn(params);

      if (result instanceof Response) {
        return result;
      } else {
        return Response.json(result);
      }
    } catch (e: unknown) {
      if (e instanceof Response) {
        return e;
      } else if (
        e instanceof Error && e.message.includes("not found")
      ) {
        return notFound();
      } else {
        console.error(
          `Error calling worker function: "${functionName}()" in "${
            targetModule[0]
          }"`,
          e,
        );
        return plainError(
          500,
          "Internal Server Error",
          e instanceof Error ? e.message : undefined,
        );
      }
    }
  }),
);

function urlParams(searchParams: URLSearchParams): Record<string, string> {
  const params: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    params[key] = value;
  });
  return params;
}
