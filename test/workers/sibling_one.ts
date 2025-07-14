// deno-lint-ignore-file no-explicit-any

export function setState(value: string): void {
  (globalThis as any).__shared_state__ = value;
  console.log("SIBLING ONE", (globalThis as any).__shared_state__);
}
