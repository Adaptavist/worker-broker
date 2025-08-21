/// <reference lib="deno.worker" />
import { onmessage } from "@jollytoad/worker-broker/onmessage";
import type { WorkerMsgCall } from "@jollytoad/worker-broker/types";

function initialCall(_msg: WorkerMsgCall) {
  self.postMessage("initialCall");
}

function beforeCall(_msg: WorkerMsgCall) {
  self.postMessage("beforeCall");
}

function afterCall(_msg: WorkerMsgCall) {
  self.postMessage("afterCall");
}

function onError(_msg: WorkerMsgCall, error: unknown) {
  self.postMessage("onError");
  return { error };
}

self.onmessage = onmessage({ initialCall, beforeCall, afterCall, onError });
