import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { RuleTester } from '@typescript-eslint/rule-tester';
import tsEslintParser from '@typescript-eslint/parser';
import { noCrossPluginImports } from './noCrossPluginImports';

// A monorepo with two plugins and a shared workspace package, linked into node_modules like a package manager would.
const repo = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'no-cross-plugin-imports-')));

function writeFile(relativePath: string, content = '') {
  const filePath = path.join(repo, relativePath);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
}

function link(name: string, target: string) {
  const linkPath = path.join(repo, 'node_modules', name);
  fs.mkdirSync(path.dirname(linkPath), { recursive: true });
  fs.symlinkSync(path.join(repo, target), linkPath, 'dir');
}

writeFile('plugins/a/src/plugin.json', '{ "id": "myorg-a-panel" }');
writeFile('plugins/a/src/module.ts');
writeFile('plugins/a/src/datasource/plugin.json', '{ "id": "myorg-a-datasource" }');
writeFile('plugins/b/package.json', '{ "name": "myorg-b-panel" }');
writeFile('plugins/b/src/plugin.json', '{ "id": "myorg-b-panel" }');
writeFile('plugins/b/src/thing.ts');
writeFile('packages/shared/package.json', '{ "name": "@myorg/shared" }');
writeFile('node_modules/react/package.json', '{ "name": "react" }');
link('myorg-b-panel', 'plugins/b');
link('@myorg/shared', 'packages/shared');

const moduleFile = path.join(repo, 'plugins/a/src/module.ts');

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tsEslintParser,
  },
});

ruleTester.run('no-cross-plugin-imports', noCrossPluginImports, {
  valid: [
    { code: `import { local } from './components/local';`, filename: moduleFile },
    { code: `import { nested } from './datasource/datasource';`, filename: moduleFile },
    { code: `import React from 'react';`, filename: moduleFile },
    { code: `import { shared } from '@myorg/shared';`, filename: moduleFile },
    { code: `import { sub } from '@myorg/shared/sub';`, filename: moduleFile },
    { code: `import { missing } from 'not-installed';`, filename: moduleFile },
    { code: `import { other } from '../../b/src/thing';`, filename: path.join(repo, 'scripts/tool.ts') },
  ],
  invalid: [
    {
      code: `import { thing } from '../../b/src/thing';`,
      filename: moduleFile,
      errors: [{ messageId: 'crossPluginImport' }],
    },
    {
      code: `import { thing } from 'myorg-b-panel/src/thing';`,
      filename: moduleFile,
      errors: [{ messageId: 'crossPluginImport' }],
    },
    {
      code: `import { shared } from '../../../packages/shared/src/index';`,
      filename: moduleFile,
      errors: [{ messageId: 'importOutsidePlugin' }],
    },
    {
      code: `export * from '../../b/src/thing';`,
      filename: moduleFile,
      errors: [{ messageId: 'crossPluginImport' }],
    },
    {
      code: `export { thing } from '../../b/src/thing';`,
      filename: moduleFile,
      errors: [{ messageId: 'crossPluginImport' }],
    },
    {
      code: `const thing = import('../../b/src/thing');`,
      filename: moduleFile,
      errors: [{ messageId: 'crossPluginImport' }],
    },
    {
      code: `const thing = require('../../b/src/thing');`,
      filename: moduleFile,
      errors: [{ messageId: 'crossPluginImport' }],
    },
  ],
});
