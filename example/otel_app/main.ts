#!/usr/bin/env -S deno run --allow-net --watch

import handler from "./handler.ts";
import { withFallback } from "@http/route/with-fallback";

await Deno.serve({
  handler: withFallback(handler),
  port: 4318,
}).finished;
