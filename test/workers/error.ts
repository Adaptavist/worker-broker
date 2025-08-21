export function throwError(): { error?: Error } {
  throw new Error("Something went wrong");
}
