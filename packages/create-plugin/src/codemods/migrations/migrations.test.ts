import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import defaultMigrations, { hasPromptStep, isScriptMigration, Migration } from './migrations.js';

describe('migrations json', () => {
  // As migration scripts are imported dynamically when update is run we assert the path is valid
  // Vitest 4 reimplemented its workers, which caused the previous dynamic import tests to fail.
  // This test now only asserts that the migration script source file exists.
  defaultMigrations.forEach((migration) => {
    it(`should have a script and/or a prompt for ${migration.name}`, () => {
      expect(isScriptMigration(migration) || hasPromptStep(migration)).toBe(true);
    });

    if (isScriptMigration(migration)) {
      it(`should have a valid migration script path for ${migration.name}`, () => {
        // import.meta.resolve() returns a file:// URL, convert to path
        const filePath = fileURLToPath(migration.scriptPath);
        const sourceFilePath = filePath.replace('.js', '.ts');
        expect(existsSync(sourceFilePath)).toBe(true);
      });
    }

    if (hasPromptStep(migration)) {
      it(`should have a valid prompt file for ${migration.name}`, () => {
        // prompt files ship verbatim so there is no compiled extension to map back to source
        expect(existsSync(fileURLToPath(migration.prompt))).toBe(true);
      });
    }
  });
});

describe('migration type guards', () => {
  const scriptOnly: Migration = {
    name: 'script-only',
    version: '1.0.0',
    description: 'a migration with only a codemod script',
    scriptPath: 'file:///virtual/scripts/001-script-only.js',
  };
  const hybrid: Migration = {
    name: 'hybrid',
    version: '1.0.0',
    description: 'a migration with a codemod script and a prompt',
    scriptPath: 'file:///virtual/scripts/002-hybrid.js',
    prompt: 'file:///virtual/prompts/002-hybrid.md',
  };
  const promptOnly: Migration = {
    name: 'prompt-only',
    version: '1.0.0',
    description: 'a migration with only a prompt',
    prompt: 'file:///virtual/prompts/003-prompt-only.md',
  };

  it('isScriptMigration should return true only for migrations with a script', () => {
    expect(isScriptMigration(scriptOnly)).toBe(true);
    expect(isScriptMigration(hybrid)).toBe(true);
    expect(isScriptMigration(promptOnly)).toBe(false);
  });

  it('hasPromptStep should return true only for migrations with a prompt', () => {
    expect(hasPromptStep(scriptOnly)).toBe(false);
    expect(hasPromptStep(hybrid)).toBe(true);
    expect(hasPromptStep(promptOnly)).toBe(true);
  });
});
