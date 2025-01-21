// deno-lint-ignore-file no-explicit-any
import { getState, setState } from "../state.ts";

setState("test2");

export function global({ set }: any) {
  if (set) {
    (globalThis as any).FOO = set;
  }
  return (globalThis as any).FOO;
}

export function state({ set }: any) {
  if (set) {
    setState(set);
  }
  return getState();
}
