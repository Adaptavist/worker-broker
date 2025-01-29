import { brokerProxy } from "@jollytoad/worker-broker/worker";
import type * as Responses from "./responses.ts";

const broker = brokerProxy();
const responses = broker.workerProxy<typeof Responses>("./responses.ts");

export function throwForbidden() {
  return responses.throwForbidden();
}

export function returnForbidden() {
  return responses.returnForbidden();
}
