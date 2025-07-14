// deno-lint-ignore-file no-explicit-any

export function getState(): string {
  console.log("SIBLING TWO", (globalThis as any).__shared_state__);
  return (globalThis as any).__shared_state__;
}
