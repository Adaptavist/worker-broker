import { WorkerBroker } from "@adaptavist/worker-broker/broker";
import { cleaner } from "@adaptavist/worker-broker/cleaner";
import { enableDebugging } from "@adaptavist/worker-broker/debug";
import { format as formatBytes } from "@std/fmt/bytes";
import { format as formatTime } from "@std/fmt/duration";
import { delay } from "@std/async/delay";

enableDebugging(true);

const broker = new WorkerBroker({
  workerCleaner: cleaner({
    memoryCeiling: 100_000_000,
    workerCount: 10,
  }),
});

function addWorker(i: number) {
  const memBefore = Deno.memoryUsage();
  const timeBefore = Date.now();

  broker.getWorker(new URL("./http/hello.ts", import.meta.url), String(i));

  const timeAfter = Date.now();
  const memAfter = Deno.memoryUsage();

  console.log(
    formatBytes(memAfter.rss - memBefore.rss),
    "in",
    formatTime(timeAfter - timeBefore, { ignoreZero: true }),
  );
}

const memStart = Deno.memoryUsage();

for (let i = 0; i < 20; i++) {
  await addWorker(i);
  await delay(100);
}

const memEnd = Deno.memoryUsage();

console.log(
  formatBytes(memStart.rss),
  "->",
  formatBytes(memEnd.rss),
  "=",
  formatBytes(memEnd.rss - memStart.rss),
);

broker.terminate();

await delay(100);

const memTerm = Deno.memoryUsage();

console.log(
  formatBytes(memStart.rss),
  "->",
  formatBytes(memTerm.rss),
  "=",
  formatBytes(memTerm.rss - memStart.rss),
);
