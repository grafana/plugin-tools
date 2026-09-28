import { existsSync, readFileSync } from 'node:fs';
import { basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { lte, valid } from 'semver';
import defaultMigrations from './migrations.js';
import { UNRELEASED } from '../../constants.js';

const RELEASE_PLEASE_ANNOTATION = 'x-release-please-version';

const packageVersion: string = JSON.parse(
  readFileSync(new URL('../../../package.json', import.meta.url), 'utf-8')
).version;

// release-please rewrites the registry as text, so some rules can only be checked against the source.
const registrySource = readFileSync(new URL('./migrations.ts', import.meta.url), 'utf-8');
const versionLines = registrySource
  .slice(registrySource.indexOf('export default ['))
  .split('\n')
  .filter((line) => /^\s*version:/.test(line));

const releasedMigrations = defaultMigrations.filter((migration) => migration.version !== UNRELEASED);

describe('migrations json', () => {
  // As migration scripts are imported dynamically when update is run we assert the path is valid
  // Vitest 4 reimplemented its workers, which caused the previous dynamic import tests to fail.
  // This test now only asserts that the migration script source file exists.
  defaultMigrations.forEach((migration) => {
    it(`should have a valid migration script path for ${migration.name}`, () => {
      // import.meta.resolve() returns a file:// URL, convert to path
      const filePath = fileURLToPath(migration.scriptPath);
      const sourceFilePath = filePath.replace('.js', '.ts');
      expect(existsSync(sourceFilePath)).toBe(true);
    });
  });

  it('should only use released versions that exist', () => {
    // An invalid version never satisfies a range, so the migration would silently never run. A version above
    // package.json has not been released yet, so the migration would stay dormant until it is.
    releasedMigrations.forEach((migration) => {
      expect(valid(migration.version), migration.name).not.toBeNull();
      expect(lte(migration.version, packageVersion), `${migration.name} (${migration.version})`).toBe(true);
    });
  });

  it('should order released versions ascending and list unreleased migrations last', () => {
    releasedMigrations.slice(1).forEach((migration, index) => {
      expect(lte(releasedMigrations[index].version, migration.version), migration.name).toBe(true);
    });

    const firstUnreleasedIndex = defaultMigrations.findIndex((migration) => migration.version === UNRELEASED);
    const isUnreleasedLast =
      firstUnreleasedIndex === -1 ||
      defaultMigrations.slice(firstUnreleasedIndex).every((migration) => migration.version === UNRELEASED);
    expect(isUnreleasedLast).toBe(true);
  });

  it('should number migrations sequentially and match their script names', () => {
    defaultMigrations.forEach((migration, index) => {
      const expectedPrefix = String(index + 1).padStart(3, '0');
      expect(migration.name.startsWith(`${expectedPrefix}-`), migration.name).toBe(true);
      expect(basename(fileURLToPath(migration.scriptPath), '.js')).toBe(migration.name);
    });

    const names = defaultMigrations.map((migration) => migration.name);
    expect(new Set(names).size).toBe(names.length);
  });

  describe('release-please annotations', () => {
    it('should find one version line per migration', () => {
      expect(versionLines).toHaveLength(defaultMigrations.length);
    });

    it('should write unreleased versions as a literal release-please can rewrite', () => {
      // release-please matches digits in the source text, so `version: UNRELEASED` would never be replaced.
      versionLines.forEach((line) => {
        expect(line).not.toMatch(/version:\s*UNRELEASED\b/);
      });
    });

    it('should only use the annotation on migration version lines', () => {
      // release-please rewrites any semver on an annotated line, including one inside a comment.
      const annotatedLines = registrySource.split('\n').filter((line) => line.includes(RELEASE_PLEASE_ANNOTATION));
      annotatedLines.forEach((line) => {
        expect(line, line.trim()).toMatch(/^\s*version:/);
      });
    });

    it('should annotate unreleased migrations and only those', () => {
      // Without the annotation an unreleased migration is never frozen and re-runs on every release.
      // A left-over annotation on a released migration would be re-stamped with the next release version.
      versionLines.forEach((line, index) => {
        const isUnreleased = line.includes(`'${UNRELEASED}'`);
        const isAnnotated = line.includes(RELEASE_PLEASE_ANNOTATION);
        expect(isAnnotated, `${defaultMigrations[index].name}: ${line.trim()}`).toBe(isUnreleased);
      });
    });
  });
});
