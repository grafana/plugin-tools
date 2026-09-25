import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import defaultAdditions, { Addition, hasPromptStep, isScriptAddition } from './additions.js';

const scriptOnly = {
  name: 'script-only-fixture',
  description: 'A script-only addition',
  scriptPath: 'file:///tmp/script-only-fixture.js',
} satisfies Addition;

const promptOnly = {
  name: 'prompt-only-fixture',
  description: 'A prompt-only addition',
  prompt: 'file:///tmp/prompt-only-fixture.md',
} satisfies Addition;

const hybrid = {
  name: 'hybrid-fixture',
  description: 'A hybrid addition',
  scriptPath: 'file:///tmp/hybrid-fixture.js',
  prompt: 'file:///tmp/hybrid-fixture.md',
} satisfies Addition;

describe('addition type guards', () => {
  describe('isScriptAddition', () => {
    it('should be true for a script-only addition', () => {
      expect(isScriptAddition(scriptOnly)).toBe(true);
    });

    it('should be true for a hybrid addition', () => {
      expect(isScriptAddition(hybrid)).toBe(true);
    });

    it('should be false for a prompt-only addition', () => {
      expect(isScriptAddition(promptOnly)).toBe(false);
    });
  });

  describe('hasPromptStep', () => {
    it('should be true for a prompt-only addition', () => {
      expect(hasPromptStep(promptOnly)).toBe(true);
    });

    it('should be true for a hybrid addition', () => {
      expect(hasPromptStep(hybrid)).toBe(true);
    });

    it('should be false for a script-only addition', () => {
      expect(hasPromptStep(scriptOnly)).toBe(false);
    });
  });
});

describe('additions json', () => {
  it('should register at least one addition', () => {
    expect(defaultAdditions.length).toBeGreaterThan(0);
  });

  defaultAdditions.forEach((addition) => {
    it(`should declare a script path or a prompt for ${addition.name}`, () => {
      expect(isScriptAddition(addition) || hasPromptStep(addition)).toBe(true);
    });
  });

  // As addition scripts are imported dynamically when add is run we assert the path is valid.
  // Vitest 4 reimplemented its workers, which caused the previous dynamic import tests to fail.
  // These tests now only assert that the source files exist.
  defaultAdditions.filter(isScriptAddition).forEach((addition) => {
    it(`should have a valid addition script path for ${addition.name}`, () => {
      // import.meta.resolve() returns a file:// URL, convert to path
      const filePath = fileURLToPath(addition.scriptPath);
      const sourceFilePath = filePath.replace('.js', '.ts');
      expect(existsSync(sourceFilePath)).toBe(true);
    });
  });

  defaultAdditions.filter(hasPromptStep).forEach((addition) => {
    it(`should have a valid prompt path for ${addition.name}`, () => {
      expect(existsSync(fileURLToPath(addition.prompt))).toBe(true);
    });
  });
});
