import type { WorkerSpecifier } from "./types.ts";

let specifier: [string, string?];

/**
 * Set the WorkerSpecifier of the current Worker.
 */
export function setSpecifier(moduleUrl: string | URL, segregationId?: string) {
  if (!specifier) {
    specifier = [moduleUrl.toString(), segregationId];
  }
}

/**
 * Get the WorkerSpecifier of the current Worker.
 */
export function getSpecifier(): WorkerSpecifier {
  return specifier;
}
