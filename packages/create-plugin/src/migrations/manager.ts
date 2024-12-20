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
import { access, constants, readFile } from 'node:fs/promises';

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

export class Context {
  private files: ContextFile = {};
  basePath: string;

  constructor(basePath: string) {
    this.basePath = basePath;
  }

  // Adds a new file to the plugins
  // `filePath` is always relative to the plugin root
  async addFile(filePath: string, content: string) {
    if (!(await this.doesFileExist(filePath))) {
      this.files[filePath] = { content };
    }

    // Error if file exists
  }

  // `filePath` is always relative to the plugin root
  // Errors out if the file does not exist
  async deleteFile(filePath: string) {
    if (await this.doesFileExist(filePath)) {
      this.files[filePath] = { ...this.files[filePath], deleted: true };
    }
    // Error if file does not exist
  }

  // Applies update to a file in the plugins source code
  async updateFile(filePath: string, content: string) {
    if (await this.doesFileExist(filePath)) {
      this.files[filePath] = { content };
    }
    // Error if file does not exist
  }

  async doesFileExist(filePath: string) {
    try {
      await access(filePath, constants.R_OK | constants.W_OK);
      return true;
    } catch {
      return false;
    }
  }

  // Searches a file based on a path in the plugins source code
  async getFile(filePath: string) {
    if (!(await this.doesFileExist(filePath))) {
      return null;
    }
    const contents = await readFile(filePath, 'utf-8');
    return contents;
  }
}

export async function runMigrations(migrations: MigrationMeta[]) {
  const basePath = process.cwd();
  for (const migration of migrations) {
    try {
      const context = await runMigration(migration, new Context(basePath));
      console.log(context);

      // logDiffForMigration(migration, context);
      // applyChangesForMigration(migration, context);
      // writeCPRCFile(migration.version);
    } catch (error) {
      // Log the error
      // We stop if any migration fails
    }
  }

  // logChngesSummary(context);
  // applyChangesToFiles(context);
}

export async function runMigration(migration: MigrationMeta, context: Context): Promise<Context> {
  // Run the migration script
  console.log(`Running migration: ${migration.description}`);
  return context;
}
