import fs from 'node:fs';
import path from 'node:path';
import { dirSync } from 'tmp';
import { vi } from 'vitest';

import { getPackageJson, writePackageJson } from '../utils.packagejson.js';
import { getPackageManagerWithFallback } from '../utils.packageManager.js';
import { isPluginDirectory } from '../utils.plugin.js';
import { getTemplateData } from '../utils.templates.js';

const tmpObj = dirSync({ unsafeCleanup: true });

const pluginJson = {
  id: 'myorg-root-panel',
  name: 'Root',
  type: 'panel',
  info: { author: { name: 'Myorg' } },
};

// Reads from an explicit root must not depend on the current working directory.
describe('Utils / explicit project root', () => {
  let projectRoot: string;

  beforeEach(() => {
    // Point cwd at an empty sandbox so a regression can't read from or write to this package.
    vi.spyOn(process, 'cwd').mockReturnValue(fs.mkdtempSync(path.join(tmpObj.name, 'cwd-')));
    projectRoot = fs.mkdtempSync(path.join(tmpObj.name, 'root-'));
    fs.mkdirSync(path.join(projectRoot, 'src'), { recursive: true });
    fs.writeFileSync(path.join(projectRoot, 'src', 'plugin.json'), JSON.stringify(pluginJson));
    fs.writeFileSync(
      path.join(projectRoot, 'package.json'),
      JSON.stringify({ name: 'root', packageManager: 'yarn@4.10.3' })
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  afterAll(() => {
    tmpObj.removeCallback();
  });

  test('isPluginDirectory() checks the given root', () => {
    expect(isPluginDirectory(projectRoot)).toBe(true);
    expect(isPluginDirectory(path.join(projectRoot, 'src'))).toBe(false);
  });

  test('writePackageJson() writes to the given root', () => {
    writePackageJson({ ...getPackageJson(projectRoot), version: '2.0.0' }, projectRoot);

    expect(getPackageJson(projectRoot).version).toBe('2.0.0');
  });

  test('getPackageManagerWithFallback() reads the package.json in the given root', () => {
    expect(getPackageManagerWithFallback(projectRoot)).toEqual({
      packageManagerName: 'yarn',
      packageManagerVersion: '4.10.3',
    });
  });

  test('getTemplateData() reads plugin data from the given root', () => {
    const templateData = getTemplateData(undefined, projectRoot);

    expect(templateData.pluginId).toBe(pluginJson.id);
    expect(templateData.orgName).toBe('Myorg');
    expect(templateData.packageManagerName).toBe('yarn');
  });
});
