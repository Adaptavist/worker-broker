import { onmessage } from "@jollytoad/worker-broker/onmessage";
import type { WorkerMsgCall } from "@jollytoad/worker-broker/types";

declare const self: Worker;

function initialCall(_msg: WorkerMsgCall) {
  self.postMessage("initialCall");
}

function beforeCall(_msg: WorkerMsgCall) {
  self.postMessage("beforeCall");
}

function afterCall(_msg: WorkerMsgCall) {
  self.postMessage("afterCall");
}

self.onmessage = onmessage({ initialCall, beforeCall, afterCall });
