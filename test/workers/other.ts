export function getWelcome(name: string): string {
  return `Hello ${name}`;
}

export function manyThings(): string[] {
  return ["one", "two", "three"];
}

export async function* moreThings(): AsyncIterable<string> {
  yield "four";
  yield "five";
  yield "six";
}
