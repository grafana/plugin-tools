import path from 'node:path';
import { Addition } from '../../codemods/additions/additions.js';
import { PluginEntry, ProjectLayout } from '../../utils/utils.project.js';

export type ConfirmAllPlugins = (plugins: PluginEntry[]) => Promise<boolean>;

function describePlugin(plugin: PluginEntry) {
  return plugin.id ? `${plugin.id} (${plugin.dir})` : plugin.dir;
}

function matchesPlugin(plugin: PluginEntry, requested: string) {
  return plugin.id === requested || path.normalize(plugin.dir) === path.normalize(requested).replace(/\/$/, '');
}

/**
 * Picks the plugins an addition runs against. `requested` holds the --plugin values (plugin ids or directories).
 * Repo-scoped additions always run against every plugin; plugin-scoped additions in a monorepo run against the
 * requested plugins, or every plugin once the user confirms.
 */
export async function selectAdditionTargets(
  addition: Addition,
  project: ProjectLayout,
  requested: string[],
  confirmAll: ConfirmAllPlugins
): Promise<PluginEntry[]> {
  if (project.kind === 'monorepo' && !addition.supportsMonorepo) {
    throw new Error(`The ${addition.name} addition is not supported in plugin monorepos yet.`);
  }

  if (addition.scope === 'repo') {
    if (requested.length > 0) {
      throw new Error(
        `The ${addition.name} addition changes shared configuration, so it applies to every plugin. Remove --plugin.`
      );
    }
    return project.plugins;
  }

  if (requested.length > 0) {
    const unknown = requested.find((value) => !project.plugins.some((plugin) => matchesPlugin(plugin, value)));
    if (unknown) {
      throw new Error(
        `Unknown plugin "${unknown}". Available plugins:\n${project.plugins.map(describePlugin).join('\n')}`
      );
    }
    // Keep the project's plugin order and drop duplicates.
    return project.plugins.filter((plugin) => requested.some((value) => matchesPlugin(plugin, value)));
  }

  if (project.kind === 'single') {
    return project.plugins;
  }

  if (await confirmAll(project.plugins)) {
    return project.plugins;
  }

  throw new Error(`Choose the plugins to add ${addition.name} to with --plugin <plugin-id>.`);
}
