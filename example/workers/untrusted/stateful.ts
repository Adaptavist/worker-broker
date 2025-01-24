/// <reference no-default-lib="true" />
/// <reference lib="deno.worker" />

let state: string = "";

export function setState(value: string): void {
  state = value;
}

export function getState(): string {
  return state;
}
