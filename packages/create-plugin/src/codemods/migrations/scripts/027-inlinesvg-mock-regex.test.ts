import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import migrate from './027-inlinesvg-mock-regex.js';
import { Context } from '../../context.js';

const MOCK_PATH = '.config/jest/mocks/react-inlinesvg.tsx';

const newMock = readFileSync(
  new URL('../../../../templates/common/.config/jest/mocks/react-inlinesvg.tsx', import.meta.url),
  'utf-8'
);

const oldMock = newMock
  .replace(
    'const SVG_FILE_NAME_REGEX = /.\\/([^/]+)\\.svg$/;',
    () => 'const SVG_FILE_NAME_REGEX = /(.+)\\/(.+)\\.svg$/;'
  )
  .replace(
    'const testId = src.match(SVG_FILE_NAME_REGEX)?.[1] ?? src;',
    () => "const testId = src.replace(SVG_FILE_NAME_REGEX, '$2');"
  );

describe('027-inlinesvg-mock-regex', () => {
  it('should replace the backtracking regex with the template version', () => {
    expect(oldMock).not.toBe(newMock);
    const context = new Context('/virtual');
    context.addFile(MOCK_PATH, oldMock);

    const result = migrate(context);

    expect(result.getFile(MOCK_PATH)).toBe(newMock);
  });

  it('should not modify the file if already migrated', () => {
    const context = new Context('/virtual');
    context.addFile(MOCK_PATH, newMock);

    const result = migrate(context);

    expect(result.getFile(MOCK_PATH)).toBe(newMock);
  });

  it('should do nothing if the mock does not exist', () => {
    const context = new Context('/virtual');

    const result = migrate(context);

    expect(result.hasChanges()).toBe(false);
  });

  it('should not modify a customised mock', () => {
    const context = new Context('/virtual');
    const customMock = oldMock.replace("'$2'", () => "'$1'");
    context.addFile(MOCK_PATH, customMock);

    const result = migrate(context);

    expect(result.getFile(MOCK_PATH)).toBe(customMock);
  });

  it('should be idempotent', async () => {
    const context = new Context('/virtual');
    context.addFile(MOCK_PATH, oldMock);

    await expect(migrate).toBeIdempotent(context);
  });
});
