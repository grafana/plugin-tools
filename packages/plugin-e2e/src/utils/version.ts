function parseVer(v: string): [number, number, number] {
  const [ma = 0, mi = 0, pa = 0] = v.split('.').map(Number);
  return [ma, mi, pa];
}

function cmp(a: string, b: string): number {
  const [ma, na, pa] = parseVer(a);
  const [mb, nb, pb] = parseVer(b);
  return ma !== mb ? ma - mb : na !== nb ? na - nb : pa - pb;
}

/**
 * Returns true when version `a` is greater than or equal to version `b`.
 *
 * @param a - A semantic version string in the form `MAJOR.MINOR.PATCH`.
 * @param b - A semantic version string in the form `MAJOR.MINOR.PATCH`.
 */
export const gte = (a: string, b: string): boolean => cmp(a, b) >= 0;

/**
 * Returns true when version `a` is strictly less than version `b`.
 *
 * @param a - A semantic version string in the form `MAJOR.MINOR.PATCH`.
 * @param b - A semantic version string in the form `MAJOR.MINOR.PATCH`.
 */
export const lt = (a: string, b: string): boolean => cmp(a, b) < 0;

/**
 * Returns true when version `a` is less than or equal to version `b`.
 *
 * @param a - A semantic version string in the form `MAJOR.MINOR.PATCH`.
 * @param b - A semantic version string in the form `MAJOR.MINOR.PATCH`.
 */
export const lte = (a: string, b: string): boolean => cmp(a, b) <= 0;

/**
 * Returns true when version `a` is strictly greater than version `b`.
 *
 * @param a - A semantic version string in the form `MAJOR.MINOR.PATCH`.
 * @param b - A semantic version string in the form `MAJOR.MINOR.PATCH`.
 */
export const gt = (a: string, b: string): boolean => cmp(a, b) > 0;

/**
 * Returns true when version `a` is equal to version `b` at MAJOR.MINOR.PATCH precision.
 *
 * @param a - A semantic version string in the form `MAJOR.MINOR.PATCH`.
 * @param b - A semantic version string in the form `MAJOR.MINOR.PATCH`.
 */
export const eq = (a: string, b: string): boolean => cmp(a, b) === 0;

/**
 * Returns true when `version` satisfies the given range expression.
 *
 * Supports a small subset of semver range syntax suitable for Grafana version checks:
 * - Exact: `"1.2.3"` (equivalent to `=1.2.3`)
 * - Comparators: `">=1.2.3"`, `">1.2.3"`, `"<=1.2.3"`, `"<1.2.3"`, `"=1.2.3"`
 * - Conjunction (AND) via whitespace: `">=1.2.3 <2.0.0"`
 * - Disjunction (OR) via `||`: `">=1.2.3 <2.0.0 || >=3.0.0"`
 *
 * Caret (`^`) and tilde (`~`) prefixes and hyphen ranges are not supported.
 *
 * @param version - A semantic version string in the form `MAJOR.MINOR.PATCH`.
 * @param range - A range expression using the syntax described above.
 */
export const satisfies = (version: string, range: string): boolean => {
  const orGroups = range.split('||').map((group) => group.trim());
  return orGroups.some((group) => {
    const comparators = group.split(/\s+/).filter(Boolean);
    return comparators.every((comparator) => evalComparator(version, comparator));
  });
};

function evalComparator(version: string, comparator: string): boolean {
  const match = comparator.match(/^(>=|<=|>|<|=)?(.+)$/);
  if (!match) {
    return false;
  }
  const [, op = '=', target] = match;
  switch (op) {
    case '>=':
      return gte(version, target);
    case '<=':
      return lte(version, target);
    case '>':
      return gt(version, target);
    case '<':
      return lt(version, target);
    case '=':
    default:
      return eq(version, target);
  }
}
