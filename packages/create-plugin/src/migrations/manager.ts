/**
 * - Read the migrations.json & current version ----> figure out what we need to run
 * - Find the relevant scripts to run
 * - Run the scripts
 *      - Script updates source files in the plugin
 */

import path from 'node:path';
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
