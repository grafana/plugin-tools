/**
 * - Read the migrations.json & current version ----> figure out what we need to run
 * - Find the relevant scripts to run
 * - Run the scripts
 *      - Script updates source files in the plugin
 */

import path from 'node:path';
import { satisfies } from 'semver';
import { readJsonFile } from '../utils/utils.files.js';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
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

type ContextFile = Record<
  string,
  {
    // The new content of the file
    content: string;
    // If `true` then it will delete the file regardless of the content
    deleted?: true;
  }
>;

class Context {
  private files: ContextFile = {};

  constructor() {}

  // Adds a new file to the plugins
  // `filePath` is always relative to the plugin root
  addFile(filePath: string, content: string) {
    if (!(await this.doesHavePermissionToWrite(filePath))) {
    }

    this.files[filePath] = { content };
    // Error if no permission to write
  }

  // `filePath` is always relative to the plugin root
  // Errors out if the file does not exist
  deleteFile(filePath: string) {
    if (!(await this.doesHavePermissionToWrite(filePath))) {
    }

    this.files[filePath] = { ...this.files[filePath], deleted: true };
  }

  // Applies update to a file in the plugins source code
  updateFile(filePath: string, content: string) {
    if (!(await this.doesHavePermissionToWrite(filePath))) {
    }

    this.files[filePath] = { content };
  }

  async doesFileExist(filePath: string) {
    // check if a file with filepath exists on the disk
  }

  async doesHavePermissionToWrite(filePath: string) {}

  // Searches a file based on a path in the plugins source code
  async getFile(filePath: string) {
    if (!(await this.doesFileExist(filePath))) {
      // log error
      return;
    }

    const contents = fs.readFileSync(filePath, 'utf-8');

    return contents;
  }
}

export async function runMigrations(migrations: MigrationMeta[]) {
  for (const migration of migrations) {
    try {
      const context = await runMigration(migration, new Context());

      // logDiffForMigration(migration, context);
      // applyChangesForMigration(migration, context);
    } catch (error) {
      // Log the error
    }
  }

  // logChngesSummary(context);
  // applyChangesToFiles(context);
}

export async function runMigration(migration: MigrationMeta, context: Context): Context {
  // Run the migration script
  console.log(`Running migration: ${migration.description}`);
}
