import { brokerProxy } from "@jollytoad/worker-broker/worker";
import type * as Other from "./other.ts";

const broker = brokerProxy();
const { getWelcome, manyThings, moreThings } = broker.workerProxy<typeof Other>(
  "./other.ts",
);

export async function hello(name: string) {
  const message = await getWelcome(name);
  return message;
}

export async function* things() {
  yield* await manyThings();
  yield* await moreThings();
}

export function bad() {
  throw new Error("FAIL");
}

export function nothing() {
}
