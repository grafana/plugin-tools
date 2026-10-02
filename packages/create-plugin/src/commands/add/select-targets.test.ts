import { vi } from 'vitest';

import { selectAdditionTargets } from './select-targets.js';
import { Addition } from '../../codemods/additions/additions.js';
import { ProjectLayout } from '../../utils/utils.project.js';

const pluginScoped: Addition = {
  name: 'plugin-thing',
  description: '',
  scriptPath: '',
  scope: 'plugin',
  supportsMonorepo: true,
};
const repoScoped: Addition = { ...pluginScoped, name: 'repo-thing', scope: 'repo' };

const single: ProjectLayout = { root: '/plugin', kind: 'single', plugins: [{ dir: '.', id: 'myorg-single-panel' }] };
const monorepo: ProjectLayout = {
  root: '/repo',
  kind: 'monorepo',
  plugins: [
    { dir: 'plugins/a', id: 'myorg-a-panel' },
    { dir: 'plugins/b', id: 'myorg-b-app' },
  ],
};

describe('selectAdditionTargets', () => {
  const confirmAll = vi.fn();

  beforeEach(() => {
    confirmAll.mockReset().mockResolvedValue(true);
  });

  it('targets the plugin in a single-plugin project without asking', async () => {
    await expect(selectAdditionTargets(pluginScoped, single, [], confirmAll)).resolves.toEqual(single.plugins);
    expect(confirmAll).not.toHaveBeenCalled();
  });

  it('targets every plugin for a repo-scoped addition', async () => {
    await expect(selectAdditionTargets(repoScoped, monorepo, [], confirmAll)).resolves.toEqual(monorepo.plugins);
    expect(confirmAll).not.toHaveBeenCalled();
  });

  it('rejects --plugin for a repo-scoped addition', async () => {
    await expect(selectAdditionTargets(repoScoped, monorepo, ['myorg-a-panel'], confirmAll)).rejects.toThrow(
      /applies to every plugin/
    );
  });

  it('targets the requested plugins by id or directory', async () => {
    await expect(
      selectAdditionTargets(pluginScoped, monorepo, ['myorg-b-app', 'plugins/a/'], confirmAll)
    ).resolves.toEqual([monorepo.plugins[0], monorepo.plugins[1]]);
  });

  it('lists the available plugins when a requested plugin is unknown', async () => {
    await expect(selectAdditionTargets(pluginScoped, monorepo, ['nope'], confirmAll)).rejects.toThrow(
      /myorg-a-panel.*myorg-b-app/s
    );
  });

  it('asks before applying a plugin-scoped addition to every plugin in a monorepo', async () => {
    await expect(selectAdditionTargets(pluginScoped, monorepo, [], confirmAll)).resolves.toEqual(monorepo.plugins);
    expect(confirmAll).toHaveBeenCalledWith(monorepo.plugins);
  });

  it('stops when the user declines to apply it to every plugin', async () => {
    confirmAll.mockResolvedValue(false);

    await expect(selectAdditionTargets(pluginScoped, monorepo, [], confirmAll)).rejects.toThrow(/--plugin/);
  });

  it('refuses additions that do not support monorepos yet', async () => {
    await expect(
      selectAdditionTargets({ ...pluginScoped, supportsMonorepo: false }, monorepo, ['myorg-a-panel'], confirmAll)
    ).rejects.toThrow(/not supported in plugin monorepos/);
  });
});
