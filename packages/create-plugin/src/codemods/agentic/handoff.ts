import { randomBytes } from 'node:crypto';
import { mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import * as v from 'valibot';
import { Handoff } from './types.js';

// The handoff file is ephemeral single-run IPC between the spawned agent and create-plugin:
// the agent writes it as its final action, the runner polls and consumes it immediately.
// It lives under node_modules so it is gitignored in every scaffold and never needs to persist.
export const MIGRATE_RUNS_DIR = join('node_modules', '.cache', 'grafana-create-plugin', 'migrate-runs');

const handoffSchema = v.object({
  status: v.picklist(['success', 'failed']),
  summary: v.string(),
});

export function createRunId(): string {
  return `${Date.now().toString(36)}-${randomBytes(4).toString('hex')}`;
}

export function getRunDir(basePath: string, runId: string): string {
  return join(basePath, MIGRATE_RUNS_DIR, runId);
}

export function getHandoffPath(runDir: string, migrationName: string): string {
  return join(runDir, `${migrationName}.json`);
}

// re-run before every agent session; a package manager install may have pruned the cache dir
export function ensureRunDir(runDir: string): void {
  mkdirSync(runDir, { recursive: true });
}

export function wipeMigrateRuns(basePath: string): void {
  rmSync(join(basePath, MIGRATE_RUNS_DIR), { recursive: true, force: true });
}

export function parseHandoff(raw: string): Handoff | undefined {
  try {
    const parsed = v.parse(handoffSchema, JSON.parse(raw));
    return { status: parsed.status, summary: parsed.summary };
  } catch {
    return undefined;
  }
}
