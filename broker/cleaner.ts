import { debug } from "../internal/debug.ts";
import type {
  WorkerBrokerEvent,
  WorkerCleaner,
  WorkerEvent,
} from "../internal/types.ts";

/**
 * Options for the cleaner function
 */
export interface CleanerOptions {
  /**
   * Monitor memory usage of Deno, and start killing Workers if
   * we pass this threshold (in bytes).
   */
  memoryCeiling?: number;

  /**
   * Start killing Workers if we pass this amount of Workers.
   */
  workerCount?: number;
}

interface WorkerState {
  readonly key: string;
  readonly moduleSpecifier: URL;
  readonly segregationId?: string;
  lastAccess: number;
}

/**
 * Create a WorkerCleaner that will track live Workers,
 * and start killing the most least recently used when
 * the given criteria is exceeded.
 *
 * @param options the criteria for cleaning
 */
export function cleaner(options: CleanerOptions): WorkerCleaner {
  const workers = new Map<string, WorkerState>();

  return (event: WorkerEvent | WorkerBrokerEvent) => {
    if (event.type === "terminate") {
      workers.clear();
    } else if (event.type === "remove") {
      removeWorker(event);
    } else {
      recordAccess(event);
      if (event.type === "create") {
        enforceMemoryCeiling(event);
        enforceWorkerCount(event);
      }
    }
  };

  function recordAccess({ key, moduleSpecifier, segregationId }: WorkerEvent) {
    const lastAccess = Date.now();
    const state = workers.get(key);
    if (state) {
      state.lastAccess = lastAccess;
    } else {
      workers.set(key, {
        key,
        moduleSpecifier,
        segregationId,
        lastAccess,
      });
    }
  }

  function removeWorker({ key, worker }: WorkerEvent) {
    debug("Worker cleaned out:", key);
    workers.delete(key);
    worker.terminate();
  }

  function enforceMemoryCeiling(event: WorkerEvent) {
    if (
      options.memoryCeiling && Deno.memoryUsage().rss >= options.memoryCeiling
    ) {
      debug("Memory ceiling exceeded");
      killLeastRecentlyUsed(event);
    }
  }

  function enforceWorkerCount(event: WorkerEvent) {
    if (options.workerCount && workers.size > options.workerCount) {
      debug("Worker count exceeded");
      killLeastRecentlyUsed(event);
    }
  }

  function findLeastRecentlyUsed() {
    let lruState: WorkerState | undefined;
    for (const state of workers.values()) {
      if (!lruState || state.lastAccess < lruState.lastAccess) {
        lruState = state;
      }
    }
    return lruState;
  }

  function killLeastRecentlyUsed({ broker }: WorkerEvent) {
    const lruState = findLeastRecentlyUsed();

    if (lruState) {
      const { key, moduleSpecifier, segregationId } = lruState;
      workers.delete(key);
      broker.removeWorker(moduleSpecifier, segregationId);
    }
  }
}
