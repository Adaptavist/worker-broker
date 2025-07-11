#!/usr/bin/env -S deno run --allow-net --allow-read --allow-env --watch

import { enableDebugging } from "@jollytoad/worker-broker/debug";
import init from "@http/host-deno-local/init";
import { setState } from "../lib/state.ts";
import handler from "./handler.ts";
import { setTelemetry } from "@jollytoad/worker-broker/telemetry";
import { openTelemetry } from "@jollytoad/worker-broker/opentelemetry";

if (Deno.env.get("OTEL_DENO") === "true") {
  setTelemetry(openTelemetry());
}

enableDebugging(false);

// deno-lint-ignore no-explicit-any
(globalThis as any).FOO = "foo";

// Demonstrate how the state within a module imported into the
// main thread is distinct from the same module imported into a
// worker. See the test1 & test2 worker modules for this.
setState("main");

await Deno.serve(await init(handler)).finished;
