import { describe, it, expect } from 'vitest';
import { Context } from '../../context.js';
import migrate from './005-react-18-3.js';

describe('005-react-18-3', () => {
  it('should not modify anything if package.json does not exist', async () => {
    const context = new Context('/virtual');
    await migrate(context);
    expect(context.listChanges()).toEqual({});
  });

  it('should not modify anything if there are no React dependencies', async () => {
    const context = new Context('/virtual');
    context.addFile(
      './package.json',
      JSON.stringify({
        dependencies: {
          lodash: '^4.17.21',
        },
      })
    );
    const initialChanges = context.listChanges();
    await migrate(context);
    expect(context.listChanges()).toEqual(initialChanges);
  });

  it('should not update React if version is below 18.0.0', async () => {
    const context = new Context('/virtual');
    const packageJson = {
      dependencies: {
        react: '^17.0.2',
        'react-dom': '^17.0.2',
      },
      devDependencies: {
        '@types/react': '^17.0.0',
        '@types/react-dom': '^17.0.0',
      },
    };
    context.addFile('./package.json', JSON.stringify(packageJson, null, 2));
    const initialPackageJson = context.getFile('./package.json');

    await migrate(context);

    expect(context.getFile('./package.json')).toBe(initialPackageJson);
  });

  it('should update React 18.0.0 to ^18.3.0', async () => {
    const context = new Context('/virtual');
    context.addFile(
      './package.json',
      JSON.stringify({
        dependencies: {
          react: '^18.0.0',
        },
      })
    );

    await migrate(context);

    const updatedPackageJson = JSON.parse(context.getFile('./package.json') || '{}');
    expect(updatedPackageJson.dependencies.react).toBe('^18.3.0');
    expect(updatedPackageJson.devDependencies?.['@types/react']).toBe('^18.3.0');
  });

  it('should not update React if version is already 18.3.0 or higher', async () => {
    const context = new Context('/virtual');
    const packageJson = {
      dependencies: {
        react: '^18.3.0',
        'react-dom': '^18.3.0',
      },
      devDependencies: {
        '@types/react': '^18.3.0',
        '@types/react-dom': '^18.3.0',
      },
    };
    context.addFile('./package.json', JSON.stringify(packageJson, null, 2));

    await migrate(context);

    const updatedPackageJson = JSON.parse(context.getFile('./package.json') || '{}');
    expect(updatedPackageJson.dependencies.react).toBe('^18.3.0');
    expect(updatedPackageJson.dependencies['react-dom']).toBe('^18.3.0');
  });

  it('should not downgrade React 19.0.0 to 18.3.0', async () => {
    const context = new Context('/virtual');
    const packageJson = {
      dependencies: {
        react: '^19.0.0',
        'react-dom': '^19.0.0',
      },
      devDependencies: {
        '@types/react': '^19.0.0',
        '@types/react-dom': '^19.0.0',
      },
    };
    context.addFile('./package.json', JSON.stringify(packageJson, null, 2));

    await migrate(context);

    const updatedPackageJson = JSON.parse(context.getFile('./package.json') || '{}');
    expect(updatedPackageJson.dependencies.react).toBe('^19.0.0');
    expect(updatedPackageJson.dependencies['react-dom']).toBe('^19.0.0');
    expect(updatedPackageJson.devDependencies['@types/react']).toBe('^19.0.0');
    expect(updatedPackageJson.devDependencies['@types/react-dom']).toBe('^19.0.0');
  });

  it('should handle version ranges correctly', async () => {
    const context = new Context('/virtual');
    context.addFile(
      './package.json',
      JSON.stringify({
        dependencies: {
          react: '~18.1.0',
          'react-dom': '18.2.0',
        },
      })
    );

    await migrate(context);

    const updatedPackageJson = JSON.parse(context.getFile('./package.json') || '{}');
    expect(updatedPackageJson.dependencies.react).toBe('^18.3.0');
    expect(updatedPackageJson.dependencies['react-dom']).toBe('^18.3.0');
  });

  it('should be idempotent', async () => {
    const context = new Context('/virtual');
    context.addFile(
      './package.json',
      JSON.stringify({
        dependencies: {
          react: '^18.2.0',
          'react-dom': '^18.2.0',
        },
        devDependencies: {
          '@types/react': '^18.2.0',
          '@types/react-dom': '^18.2.0',
        },
      })
    );
    await expect(migrate).toBeIdempotent(context);
  });
});
