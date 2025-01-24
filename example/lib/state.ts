let state = "undefined";

export function setState(newState: string) {
  state = newState;
}

export function getState() {
  return state;
}
