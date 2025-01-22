#!/usr/bin/env -S deno run --allow-net --allow-read --watch

import { WorkerBroker } from "../broker/mod.ts";
import { enableDebugging } from "../internal/debug.ts";
import init from "@http/host-deno-local/init";
import { notFound } from "@http/response/not-found";
import { cascade } from "@http/route/cascade";
import { byPattern } from "@http/route/by-pattern";
import { plainError } from "@http/response/plain-error";
import { ok } from "@http/response/ok";
import { setState } from "./state.ts";

enableDebugging(true);

const broker = new WorkerBroker();

const handler = cascade(
  byPattern("/:moduleName", async (_req, match) => {
    const { moduleName } = match.pathname.groups;
    const targetModule = new URL(`./http/${moduleName}.ts`, import.meta.url);

    try {
      await broker.workerImport(targetModule, undefined, Date.now());
      return ok("Module reloaded");
    } catch (e: unknown) {
      if (e instanceof Response) {
        return e;
      } else if (
        e instanceof Error && e.message.includes("Cannot load module")
      ) {
        return notFound();
      } else {
        return plainError(
          500,
          "Internal Server Error",
          e instanceof Error ? e.message : undefined,
        );
      }
    }
  }),
  byPattern("/:moduleName/:functionName", async (_req, match) => {
    const { moduleName, functionName } = match.pathname.groups;
    const targetModule = new URL(`./http/${moduleName}.ts`, import.meta.url);
    const params = urlParams(new URLSearchParams(match.search.input));

    try {
      const result = await broker.workerFnProxy(targetModule, functionName!)(
        params,
      );
      if (result instanceof Response) {
        return result;
      } else {
        return Response.json(result);
      }
    } catch (e: unknown) {
      if (e instanceof Response) {
        return e;
      } else if (
        e instanceof Error && e.message.includes("Cannot load module")
      ) {
        return notFound();
      } else {
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

// deno-lint-ignore no-explicit-any
(globalThis as any).FOO = "foo";

setState("main");

await Deno.serve(await init(handler)).finished;
