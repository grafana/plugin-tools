import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import type { TestInfo } from '@playwright/test';

import { PanelData, PanelDataFrame } from '../models/components/panelData';

/**
 * A pattern to redact from every string value in a data snapshot. A bare `RegExp` replaces matches with
 * `"<redacted>"`. Use the global flag (`g`) to replace every match in a string, and keep the replacement
 * deterministic, or the snapshot changes on every run.
 */
export type RedactRule =
  | RegExp
  | {
      pattern: RegExp;
      replacement: string | ((match: string, ...groups: string[]) => string);
    };

export interface DataSnapshotOptions {
  /**
   * Patterns to redact from string values before the snapshot is written or compared, e.g. resource ids that
   * shouldn't be committed. `panel.getData()` still returns the real values.
   *
   * @example
   * redact: [{ pattern: /i-([0-9a-f]{2})[0-9a-f]+/g, replacement: 'i-$1...' }]
   */
  redact?: RedactRule[];
  /**
   * Field names whose values are replaced with `"<ignored>"`, e.g. a time field that changes on every run.
   */
  ignoreFields?: string[];
  /**
   * Dot-separated paths to drop from the snapshot. Use `*` for any array index, e.g. `series.*.meta.notices`.
   */
  ignorePaths?: string[];
  /**
   * Keep `meta.custom` in the snapshot. It's left out by default because data sources often put timings,
   * query ids or paging tokens there.
   */
  includeMetaCustom?: boolean;
}

export type UpdateSnapshotsMode = 'all' | 'changed' | 'missing' | 'none';

export interface DataSnapshotResult {
  pass: boolean;
  written: boolean;
  expected?: string;
  message: string;
}

const IGNORED = '<ignored>';
const REDACTED = '<redacted>';

const warnedPatterns = new Set<string>();

function applyRedactRule(text: string, rule: RedactRule): string {
  const pattern = rule instanceof RegExp ? rule : rule.pattern;
  if (!pattern.global && !warnedPatterns.has(pattern.source)) {
    warnedPatterns.add(pattern.source);
    console.warn(
      `@grafana/plugin-e2e: redact pattern /${pattern.source}/ has no global flag, so only the first match in each string is replaced.`
    );
  }
  if (rule instanceof RegExp) {
    return text.replace(rule, REDACTED);
  }
  // the two replace overloads can't be called with the union type directly
  return typeof rule.replacement === 'string'
    ? text.replace(pattern, rule.replacement)
    : text.replace(pattern, rule.replacement);
}

function redactStrings(value: unknown, rules: RedactRule[]): unknown {
  if (typeof value === 'string') {
    return rules.reduce((text, rule) => applyRedactRule(text, rule), value);
  }
  if (Array.isArray(value)) {
    return value.map((item) => redactStrings(item, rules));
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, redactStrings(item, rules)]));
  }
  return value;
}

function isFrame(value: unknown): value is PanelDataFrame {
  return Boolean(value) && typeof value === 'object' && Array.isArray((value as PanelDataFrame).fields);
}

function normalizeFrame(frame: PanelDataFrame, options: DataSnapshotOptions): PanelDataFrame {
  const meta = frame.meta ? { ...frame.meta } : undefined;
  if (meta && !options.includeMetaCustom) {
    delete meta.custom;
  }
  return {
    ...frame,
    meta: meta && Object.keys(meta).length > 0 ? meta : undefined,
    fields: frame.fields.map((field) => ({
      ...field,
      values: options.ignoreFields?.includes(field.name)
        ? [IGNORED]
        : field.values.map((value) => (isFrame(value) ? normalizeFrame(value, options) : value)),
    })),
  };
}

function deletePath(target: unknown, segments: string[]): void {
  if (!target || typeof target !== 'object' || segments.length === 0) {
    return;
  }
  const [head, ...rest] = segments;
  const record = target as Record<string, unknown>;
  const keys = head === '*' ? Object.keys(record) : [head];
  for (const key of keys) {
    if (rest.length === 0) {
      delete record[key];
    } else {
      deletePath(record[key], rest);
    }
  }
}

function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortKeys);
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, sortKeys((value as Record<string, unknown>)[key])])
    );
  }
  return value;
}

/**
 * Turns panel data into the stable, pretty-printed JSON stored in a data snapshot. The request id is always
 * dropped since it changes on every run.
 */
export function serializeDataSnapshot(data: PanelData, options: DataSnapshotOptions = {}): string {
  const { requestId, ...rest } = data;
  const normalized: Record<string, unknown> = {
    ...rest,
    series: data.series.map((frame) => normalizeFrame(frame, options)),
  };
  for (const path of options.ignorePaths ?? []) {
    deletePath(normalized, path.split('.'));
  }
  const redacted = options.redact?.length ? redactStrings(normalized, options.redact) : normalized;
  return `${JSON.stringify(sortKeys(redacted), null, 2)}\n`;
}

/**
 * Combines the defaults from the `dataSnapshot` option with the options passed to one assertion. Lists are
 * concatenated with the defaults first, `includeMetaCustom` from the assertion wins, and
 * `inheritDefaults: false` ignores the defaults.
 */
export function mergeDataSnapshotOptions(
  defaults: DataSnapshotOptions | undefined,
  perCall: DataSnapshotOptions & { inheritDefaults?: boolean }
): DataSnapshotOptions {
  const { inheritDefaults, ...options } = perCall;
  if (inheritDefaults === false || !defaults) {
    return options;
  }
  return {
    ...options,
    redact: [...(defaults.redact ?? []), ...(options.redact ?? [])],
    ignoreFields: [...(defaults.ignoreFields ?? []), ...(options.ignoreFields ?? [])],
    ignorePaths: [...(defaults.ignorePaths ?? []), ...(options.ignorePaths ?? [])],
    includeMetaCustom: options.includeMetaCustom ?? defaults.includeMetaCustom,
  };
}

// matchers can't read fixtures, so the dataSnapshot option is handed over per test by an auto fixture
const snapshotDefaults = new WeakMap<TestInfo, DataSnapshotOptions>();

export function setDataSnapshotDefaults(testInfo: TestInfo, options: DataSnapshotOptions | undefined): void {
  if (options) {
    snapshotDefaults.set(testInfo, options);
  }
}

export function getDataSnapshotDefaults(testInfo: TestInfo): DataSnapshotOptions | undefined {
  return snapshotDefaults.get(testInfo);
}

function sanitizePathSegment(value: string): string {
  return value.replace(/[^\w.-]+/g, '-').replace(/^-+|-+$/g, '') || 'snapshot';
}

/**
 * `{testFileDir}/__data-snapshots__/{testFileName}/{test title}/{name}.json`. No platform or project suffix, since
 * the data doesn't depend on either and the same file should be compared on every Grafana version.
 */
export function getDataSnapshotPath(testFile: string, titlePath: string[], name: string): string {
  return join(
    dirname(testFile),
    '__data-snapshots__',
    basename(testFile),
    sanitizePathSegment(titlePath.join(' ')),
    `${sanitizePathSegment(name)}.json`
  );
}

// compare parsed JSON so a formatter or editor reflowing the file doesn't fail the test
function normalizeJson(text: string): string {
  try {
    return JSON.stringify(JSON.parse(text));
  } catch {
    return text;
  }
}

export function prettyPrintJson(text: string): string {
  try {
    return `${JSON.stringify(JSON.parse(text), null, 2)}\n`;
  } catch {
    return text;
  }
}

function writeSnapshot(path: string, actual: string) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, actual);
}

/**
 * Compares `actual` with the snapshot at `path`, writing it according to Playwright's `updateSnapshots` mode.
 */
export function compareDataSnapshot(path: string, actual: string, mode: UpdateSnapshotsMode): DataSnapshotResult {
  if (!existsSync(path)) {
    if (mode === 'none') {
      return { pass: false, written: false, message: `A data snapshot doesn't exist at ${path}.` };
    }
    writeSnapshot(path, actual);
    // like Playwright's 'missing' mode, writing a new snapshot still fails the test once
    return {
      pass: mode !== 'missing',
      written: true,
      message: `A data snapshot doesn't exist at ${path}, writing actual.`,
    };
  }

  const expected = readFileSync(path, 'utf-8');
  if (normalizeJson(expected) === normalizeJson(actual)) {
    return { pass: true, written: false, expected, message: `Data matches the snapshot at ${path}.` };
  }
  if (mode === 'all' || mode === 'changed') {
    writeSnapshot(path, actual);
    return { pass: true, written: true, expected, message: `${path} is not the same, writing actual.` };
  }
  return { pass: false, written: false, expected, message: `Data doesn't match the snapshot at ${path}.` };
}
