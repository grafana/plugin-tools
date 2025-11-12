import { describe, expect, it } from 'vitest';
import migrate from './007-remove-testing-library-types.js';
import { Context } from '../context.js';

describe('006-remove-testing-library-types', () => {
  it('should create setupTests.d.ts, remove types package, and add @testing-library/jest-dom when file does not exist', () => {
    const context = new Context('/virtual');

    context.addFile(
      'package.json',
      JSON.stringify({
        devDependencies: {
          '@types/testing-library__jest-dom': '^6.0.0',
          '@testing-library/react': '14.0.0',
        },
      })
    );

    const result = migrate(context);

    // Check that setupTests.d.ts was created
    const setupTestsContent = result.getFile('./.config/types/setupTests.d.ts');
    expect(setupTestsContent).toBe("import '@testing-library/jest-dom';\n");

    // Check that the types package was removed
    const packageJson = JSON.parse(result.getFile('package.json') || '{}');
    expect(packageJson.devDependencies).toEqual({
      '@testing-library/jest-dom': '^6.0.0',
      '@testing-library/react': '14.0.0',
    });
  });

  it('should add import to existing setupTests.d.ts, remove types package, and add @testing-library/jest-dom if missing', () => {
    const context = new Context('/virtual');

    const existingContent = '// Some other type declarations\n';
    context.addFile('./.config/types/setupTests.d.ts', existingContent);
    context.addFile(
      'package.json',
      JSON.stringify({
        devDependencies: {
          '@types/testing-library__jest-dom': '^6.0.0',
          '@testing-library/react': '14.0.0',
        },
      })
    );

    const result = migrate(context);

    // Check that import was prepended
    const setupTestsContent = result.getFile('./.config/types/setupTests.d.ts');
    expect(setupTestsContent).toBe(`import '@testing-library/jest-dom';\n${existingContent}`);

    // Check that the types package was removed
    const packageJson = JSON.parse(result.getFile('package.json') || '{}');
    expect(packageJson.devDependencies).toEqual({
      '@testing-library/jest-dom': '^6.0.0',
      '@testing-library/react': '14.0.0',
    });
  });

  it('should not modify setupTests.d.ts if import already exists', () => {
    const context = new Context('/virtual');

    const existingContent = "// Other content\nimport 'react';\nimport '@testing-library/jest-dom';\n";
    context.addFile('./.config/types/setupTests.d.ts', existingContent);
    context.addFile(
      'package.json',
      JSON.stringify({
        devDependencies: {
          '@types/testing-library__jest-dom': '^6.0.0',
          '@testing-library/react': '14.0.0',
        },
      })
    );

    const result = migrate(context);

    // Check that content was not modified
    const setupTestsContent = result.getFile('./.config/types/setupTests.d.ts');
    expect(setupTestsContent).toBe(existingContent);

    // Check that the types package was still removed
    const packageJson = JSON.parse(result.getFile('package.json') || '{}');
    expect(packageJson.devDependencies).toEqual({
      '@testing-library/jest-dom': '^6.0.0',
      '@testing-library/react': '14.0.0',
    });
  });

  it('should handle package.json without the types package', () => {
    const context = new Context('/virtual');

    context.addFile(
      'package.json',
      JSON.stringify({
        devDependencies: {
          '@testing-library/react': '14.0.0',
        },
      })
    );

    const result = migrate(context);

    // Check that setupTests.d.ts was created
    const setupTestsContent = result.getFile('./.config/types/setupTests.d.ts');
    expect(setupTestsContent).toBe("import '@testing-library/jest-dom';\n");

    // Check that package.json was not modified (no types package to remove)
    const packageJson = JSON.parse(result.getFile('package.json') || '{}');
    expect(packageJson.devDependencies).toEqual({
      '@testing-library/jest-dom': '^6.0.0',
      '@testing-library/react': '14.0.0',
    });
  });

  it('should be idempotent', async () => {
    const context = new Context('/virtual');

    context.addFile(
      'package.json',
      JSON.stringify({
        devDependencies: {
          '@types/testing-library__jest-dom': '^6.0.0',
        },
      })
    );

    await expect(migrate).toBeIdempotent(context);
  });
});
