import { brokerProxy } from "@adaptavist/worker-broker/worker";
import type * as ServiceModule from "./transfer_service.ts";

const broker = brokerProxy();
const service = broker.workerFnProxy<typeof ServiceModule.service>(
  "./transfer_service.ts",
  "service",
);

export function client(
  thing: ArrayBuffer,
  multiplier: number,
): Promise<ArrayBuffer> {
  return service({ thing, multiplier });
}
