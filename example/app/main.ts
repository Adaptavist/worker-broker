#!/usr/bin/env -S deno run --allow-net --allow-read --watch

import { enableDebugging } from "@jollytoad/worker-broker/debug";
import init from "@http/host-deno-local/init";
import { setState } from "../lib/state.ts";
import handler from "./handler.ts";

enableDebugging(true);

// deno-lint-ignore no-explicit-any
(globalThis as any).FOO = "foo";

setState("main");

await Deno.serve(await init(handler)).finished;
