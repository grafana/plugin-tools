export function partitionArr<T>(arr: T[], pred: (item: T) => boolean): [T[], T[]] {
  return arr.reduce<[T[], T[]]>((acc, i) => (acc[pred(i) ? 0 : 1].push(i), acc), [[], []]);
}
