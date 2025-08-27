import { brokerProxy } from "@adaptavist/worker-broker/worker";
import type * as Storage from "./storage.ts";

const broker = brokerProxy();
const storage = broker.workerProxy<typeof Storage>("./storage.ts");

// TODO: init storage
export async function auth(token: string) {
  await storage.put("authorization", token);
}

export async function sendMessage(message: string) {
  const authorization = await storage.get("authorization") as string;

  return fetch("https://jollytoad.free.beeceptor.com/worker-broker/test", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization,
    },
    body: JSON.stringify({
      message,
    }),
  });
}
