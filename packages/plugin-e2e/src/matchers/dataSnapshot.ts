import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';

import { PanelData, PanelDataFrame } from '../models/components/panelData';

export interface DataSnapshotOptions {
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
  return `${JSON.stringify(sortKeys(normalized), null, 2)}\n`;
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
  if (expected === actual) {
    return { pass: true, written: false, expected, message: `Data matches the snapshot at ${path}.` };
  }
  if (mode === 'all' || mode === 'changed') {
    writeSnapshot(path, actual);
    return { pass: true, written: true, expected, message: `${path} is not the same, writing actual.` };
  }
  return { pass: false, written: false, expected, message: `Data doesn't match the snapshot at ${path}.` };
}
