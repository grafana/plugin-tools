interface ParsedVer {
  major: number;
  minor: number;
  patch: number;
  pre: string[] | null;
}

function parseVer(v: string): ParsedVer {
  // split MAJOR.MINOR.PATCH from an optional dash-suffixed pre-release.
  // Grafana dev/nightly builds use this form (e.g. `10.4.0-25389005429`).
  // Build metadata after a `+` is stripped per semver.
  const cleaned = v.split('+')[0];
  const dash = cleaned.indexOf('-');
  const base = dash === -1 ? cleaned : cleaned.slice(0, dash);
  const preStr = dash === -1 ? '' : cleaned.slice(dash + 1);
  const [ma = 0, mi = 0, pa = 0] = base.split('.').map((s) => parseInt(s, 10));
  return {
    major: ma,
    minor: mi,
    patch: pa,
    pre: preStr ? preStr.split('.') : null,
  };
}

function cmpPre(a: string[], b: string[]): number {
  const len = Math.max(a.length, b.length);
  for (let i = 0; i < len; i++) {
    const ai = a[i];
    const bi = b[i];
    // a longer set of identifiers has higher precedence when all preceding are equal
    if (ai === undefined) {
      return -1;
    }
    if (bi === undefined) {
      return 1;
    }
    const aIsNum = /^\d+$/.test(ai);
    const bIsNum = /^\d+$/.test(bi);
    if (aIsNum && bIsNum) {
      const diff = parseInt(ai, 10) - parseInt(bi, 10);
      if (diff !== 0) {
        return diff;
      }
    } else if (aIsNum) {
      // numeric identifiers have lower precedence than non-numeric identifiers
      return -1;
    } else if (bIsNum) {
      return 1;
    } else if (ai < bi) {
      return -1;
    } else if (ai > bi) {
      return 1;
    }
  }
  return 0;
}

function cmp(a: string, b: string): number {
  const va = parseVer(a);
  const vb = parseVer(b);
  if (va.major !== vb.major) {
    return va.major - vb.major;
  }
  if (va.minor !== vb.minor) {
    return va.minor - vb.minor;
  }
  if (va.patch !== vb.patch) {
    return va.patch - vb.patch;
  }
  // when MAJOR.MINOR.PATCH match, a version without a pre-release has higher
  // precedence than one with a pre-release (semver section 11).
  if (!va.pre && !vb.pre) {
    return 0;
  }
  if (!va.pre) {
    return 1;
  }
  if (!vb.pre) {
    return -1;
  }
  return cmpPre(va.pre, vb.pre);
}

/**
 * Returns true when version `a` is greater than or equal to version `b`.
 *
 * Follows semver precedence rules: a release has higher precedence than any
 * pre-release of the same `MAJOR.MINOR.PATCH` (`1.2.3` > `1.2.3-anything`).
 * Pre-release identifiers are compared dot-separated, numerics numerically
 * and non-numerics lexicographically (`1.2.3-2` < `1.2.3-10`).
 *
 * @param a - A semantic version string in the form `MAJOR.MINOR.PATCH[-PRE]`.
 * @param b - A semantic version string in the form `MAJOR.MINOR.PATCH[-PRE]`.
 */
export const gte = (a: string, b: string): boolean => cmp(a, b) >= 0;

/**
 * Returns true when version `a` is strictly less than version `b`.
 *
 * Follows semver precedence rules: a release has higher precedence than any
 * pre-release of the same `MAJOR.MINOR.PATCH` (`1.2.3-anything` < `1.2.3`).
 * Pre-release identifiers are compared dot-separated, numerics numerically
 * and non-numerics lexicographically.
 *
 * @param a - A semantic version string in the form `MAJOR.MINOR.PATCH[-PRE]`.
 * @param b - A semantic version string in the form `MAJOR.MINOR.PATCH[-PRE]`.
 */
export const lt = (a: string, b: string): boolean => cmp(a, b) < 0;

/**
 * Returns true when version `a` is less than or equal to version `b`.
 *
 * Follows semver precedence rules. See {@link lt} for details.
 *
 * @param a - A semantic version string in the form `MAJOR.MINOR.PATCH[-PRE]`.
 * @param b - A semantic version string in the form `MAJOR.MINOR.PATCH[-PRE]`.
 */
export const lte = (a: string, b: string): boolean => cmp(a, b) <= 0;

/**
 * Returns true when version `a` is strictly greater than version `b`.
 *
 * Follows semver precedence rules. See {@link gte} for details.
 *
 * @param a - A semantic version string in the form `MAJOR.MINOR.PATCH[-PRE]`.
 * @param b - A semantic version string in the form `MAJOR.MINOR.PATCH[-PRE]`.
 */
export const gt = (a: string, b: string): boolean => cmp(a, b) > 0;

/**
 * Returns true when version `a` is equal to version `b` per semver precedence.
 *
 * Build metadata (after `+`) is ignored. `1.2.3` and `1.2.3-pre` are not equal.
 *
 * @param a - A semantic version string in the form `MAJOR.MINOR.PATCH[-PRE]`.
 * @param b - A semantic version string in the form `MAJOR.MINOR.PATCH[-PRE]`.
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
 * Unrecognized comparator prefixes cause that comparator to evaluate to false.
 *
 * @param version - A semantic version string in the form `MAJOR.MINOR.PATCH[-PRE]`.
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
