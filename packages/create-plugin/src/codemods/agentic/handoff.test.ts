import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  createRunId,
  ensureRunDir,
  getHandoffPath,
  getRunDir,
  MIGRATE_RUNS_DIR,
  parseHandoff,
  wipeMigrateRuns,
} from './handoff.js';

describe('run dir lifecycle', () => {
  let basePath: string;

  beforeEach(() => {
    basePath = mkdtempSync(join(tmpdir(), 'cp-handoff-test-'));
  });

  afterEach(() => {
    rmSync(basePath, { recursive: true, force: true });
  });

  it('should build run dirs under the migrate-runs cache dir', () => {
    expect(getRunDir(basePath, 'run-1')).toBe(join(basePath, MIGRATE_RUNS_DIR, 'run-1'));
  });

  it('should build handoff paths from the migration name', () => {
    const runDir = getRunDir(basePath, 'run-1');
    expect(getHandoffPath(runDir, '013-example')).toBe(join(runDir, '013-example.json'));
  });

  it('should create run dirs and tolerate them already existing', () => {
    const runDir = getRunDir(basePath, 'run-1');
    ensureRunDir(runDir);
    expect(existsSync(runDir)).toBe(true);
    expect(() => ensureRunDir(runDir)).not.toThrow();
  });

  it('should wipe all previous runs', () => {
    const runDir = getRunDir(basePath, 'run-1');
    ensureRunDir(runDir);
    writeFileSync(getHandoffPath(runDir, '013-example'), '{}');

    wipeMigrateRuns(basePath);

    expect(existsSync(join(basePath, MIGRATE_RUNS_DIR))).toBe(false);
  });

  it('should not throw when wiping a base path with no runs', () => {
    expect(() => wipeMigrateRuns(basePath)).not.toThrow();
  });
});

describe('createRunId', () => {
  it('should create ids that are safe to use as directory names', () => {
    expect(createRunId()).toMatch(/^[a-z0-9-]+$/);
  });

  it('should create unique ids', () => {
    expect(createRunId()).not.toBe(createRunId());
  });
});

describe('parseHandoff', () => {
  it('should parse a success handoff', () => {
    expect(parseHandoff('{"status":"success","summary":"done"}')).toEqual({ status: 'success', summary: 'done' });
  });

  it('should parse a failed handoff', () => {
    expect(parseHandoff('{"status":"failed","summary":"could not migrate"}')).toEqual({
      status: 'failed',
      summary: 'could not migrate',
    });
  });

  it('should drop unknown keys', () => {
    expect(parseHandoff('{"status":"success","summary":"done","extras":{"foo":1}}')).toEqual({
      status: 'success',
      summary: 'done',
    });
  });

  it('should return undefined for malformed JSON', () => {
    expect(parseHandoff('{"status": "succ')).toBeUndefined();
  });

  it('should return undefined for unexpected status values', () => {
    expect(parseHandoff('{"status":"maybe","summary":"done"}')).toBeUndefined();
  });

  it('should return undefined when summary is missing', () => {
    expect(parseHandoff('{"status":"success"}')).toBeUndefined();
  });

  it('should not be vulnerable to prototype pollution', () => {
    const handoff = parseHandoff('{"status":"success","summary":"done","__proto__":{"polluted":true}}');
    expect(handoff).toEqual({ status: 'success', summary: 'done' });
    expect('polluted' in {}).toBe(false);
  });
});
