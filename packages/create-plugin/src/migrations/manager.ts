/**
 * - Read the migrations.json & current version ----> figure out what we need to run
 * - Find the relevant scripts to run
 * - Run the scripts
 *      - Script updates source files in the plugin
 */

import path from 'node:path';
import { satisfies } from 'semver';
import { readJsonFile } from '../utils/utils.files.js';

const defaultMigrationsJsonPath = path.join(__dirname, 'migrations.json');

type MigrationMeta = {
  version: string;
  description: string;
  migrationScript: string;
};

export function getAllMigrations(migrationsJsonPath = defaultMigrationsJsonPath): Record<string, MigrationMeta> {
  const migrationsJson = readJsonFile(migrationsJsonPath);
  return migrationsJson.migrations;
}

export function getMigrationsToRun(
  fromVersion: string,
  toVersion: string,
  migrationsJsonPath = defaultMigrationsJsonPath
): Record<string, MigrationMeta> {
  const migrations = getAllMigrations(migrationsJsonPath);
  const semverRange = `${fromVersion} - ${toVersion}`;

  const migrationsToRun = Object.entries(migrations).reduce<Record<string, MigrationMeta>>((acc, [key, meta]) => {
    if (satisfies(meta.version, semverRange)) {
      acc[key] = meta;
    }
    return acc;
  }, {});

  return migrationsToRun;
}
