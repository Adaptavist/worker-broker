let state: string = "";

export function setState(value: string): void {
  state = value;
}

export function getState(): string {
  return state;
}
