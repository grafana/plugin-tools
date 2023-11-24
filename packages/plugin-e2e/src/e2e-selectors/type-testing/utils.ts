export function keysOf<T>(object: T): Array<keyof T> {
  return Object.keys(object) as Array<keyof T>;
}
