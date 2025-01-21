// deno-lint-ignore-file no-explicit-any
import { getState, setState } from "../state.ts";

setState("test1");

export function ok() {
  return "ok";
}

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

export function error() {
  throw new Error("Not ok");
}

export function forbidden() {
  throw new Response(null, {
    status: 403,
  });
}

export function redirect() {
  return new Response(null, {
    status: 302,
    headers: {
      location: "https://example.com",
    },
  });
}

export function echo(params: any) {
  return params;
}

export function proxy({ url, method = "GET" }: any = {}) {
  return fetch(new URL(url), { method });
}
