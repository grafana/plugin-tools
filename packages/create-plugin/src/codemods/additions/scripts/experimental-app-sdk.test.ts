import { Context } from '../../context.js';
import { output } from '../../../utils/utils.console.js';
import appSdk from './experimental-app-sdk.js';

vi.mock(import('../../../utils/utils.plugin.js'), async (importOriginal) => {
  const originalModule = await importOriginal();
  return {
    ...originalModule,
    getPluginJson: () => ({ id: 'my-plugin-id', name: 'My Plugin', info: { author: { name: 'my-author' } } }),
  };
});


vi.mock(import('../../utils.js'), async (importOriginal) => {
  const originalModule = await importOriginal();
  // Disk I/O is slow so render the templates once and key off the requested path.
  const render = (file: string) =>
    originalModule.renderTemplate(
      new URL(`../../../../templates/app-sdk/${file}`, import.meta.url).pathname,
      false
    );
  const rendered: Record<string, string> = {
    '.config/app-sdk/generate-kinds.mjs': render('.config/app-sdk/generate-kinds.mjs'),
    '.config/AGENTS/app-sdk.md': render('.config/AGENTS/app-sdk.md'),
    'kinds/config.cue': render('kinds/config.cue'),
    'kinds/manifest.cue': render('kinds/manifest.cue'),
    'kinds/example.cue': render('kinds/example.cue'),
    'kinds/cue.mod/module.cue': render('kinds/cue.mod/module.cue'),
    'kinds/README.md': render('kinds/README.md'),
  };
  return {
    ...originalModule,
    renderTemplate: (templatePath: string) => {
      const match = Object.keys(rendered).find((file) => templatePath.endsWith(file));
      return match ? rendered[match] : '';
    },
  };
});

const APP_SDK_FILES = [
  '.config/app-sdk/generate-kinds.mjs',
  '.config/AGENTS/app-sdk.md',
  'kinds/config.cue',
  'kinds/manifest.cue',
  'kinds/example.cue',
  'kinds/cue.mod/module.cue',
  'kinds/README.md',
];

const STOCK_COMPOSE = `services:
  grafana:
    extends:
      file: .config/docker-compose-base.yaml
      service: grafana
`;

function createAppContext({
  pluginType = 'app',
  compose = STOCK_COMPOSE,
  instructions = '# Grafana Plugin\n\n## Critical rules\n\n- Existing rule.\n',
}: { pluginType?: string; compose?: string | null; instructions?: string | null } = {}) {
  const context = new Context('/virtual');

  context.addFile('src/plugin.json', JSON.stringify({ type: pluginType, id: 'my-plugin-id', backend: false }));
  context.addFile('package.json', JSON.stringify({ scripts: { build: 'webpack' } }, null, 2));
  context.addFile('.gitignore', 'node_modules/\ndist/\n');
  context.addFile('.config/bundler/copyFiles.ts', `export const copyFilePatterns = ['**/*.json'];`);

  if (instructions !== null) {
    context.addFile('.config/AGENTS/instructions.md', instructions);
  }

  if (compose !== null) {
    context.addFile('docker-compose.yaml', compose);
  }

  return context;
}

describe('experimental-app-sdk addition', () => {
  // Silence terminal output, and let us assert on what the user is told.
  beforeEach(() => {
    vi.spyOn(output, 'log').mockImplementation(() => {});
    vi.spyOn(output, 'warning').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('preconditions', () => {
    it('makes no changes when there is no plugin.json', () => {
      const context = new Context('/virtual');

      const result = appSdk(context);

      expect(result.listChanges()).toEqual({});
    });

    it('makes no changes for a datasource plugin', () => {
      const context = createAppContext({ pluginType: 'datasource' });
      const changesBefore = Object.keys(context.listChanges()).length;

      const result = appSdk(context);

      expect(Object.keys(result.listChanges()).length).toBe(changesBefore);
      expect(result.doesFileExist('kinds/config.cue')).toBe(false);
    });

    it('makes no changes when plugin.json is malformed', () => {
      const context = new Context('/virtual');
      context.addFile('src/plugin.json', '{ not json');

      const result = appSdk(context);

      expect(result.doesFileExist('kinds/config.cue')).toBe(false);
    });
  });

  describe('scaffolding', () => {
    it('adds the kinds and the generate script', () => {
      const context = createAppContext();

      const result = appSdk(context);

      for (const file of APP_SDK_FILES) {
        expect(result.doesFileExist(file), `${file} should exist`).toBe(true);
      }
      expect(result.getFile('.config/app-sdk/generate-kinds.mjs')).toContain('grafana-app-sdk');
      expect(result.getFile('kinds/config.cue')).toContain('tsGenPath');
    });

    it('adds the generate:kinds npm script', () => {
      const context = createAppContext();

      const result = appSdk(context);

      const packageJson = JSON.parse(result.getFile('package.json') ?? '{}');
      expect(packageJson.scripts['generate:kinds']).toBe('node ./.config/app-sdk/generate-kinds.mjs');
      // Existing scripts survive.
      expect(packageJson.scripts.build).toBe('webpack');
    });

    it('does not clobber an existing generate:kinds script', () => {
      const context = createAppContext();
      context.updateFile('package.json', JSON.stringify({ scripts: { 'generate:kinds': 'my own thing' } }, null, 2));

      const result = appSdk(context);

      const packageJson = JSON.parse(result.getFile('package.json') ?? '{}');
      expect(packageJson.scripts['generate:kinds']).toBe('my own thing');
    });

    it('does not overwrite kinds a user has already edited', () => {
      const context = createAppContext();
      const userManifest = 'package kinds\n\n// my own manifest\n';
      context.addFile('kinds/manifest.cue', userManifest);

      const result = appSdk(context);

      expect(result.getFile('kinds/manifest.cue')).toBe(userManifest);
      // ...but still scaffolds the files that were missing.
      expect(result.doesFileExist('kinds/config.cue')).toBe(true);
    });

    it('points the agent instructions at the app-sdk guidance', () => {
      const context = createAppContext();

      const result = appSdk(context);

      const instructions = result.getFile('.config/AGENTS/instructions.md') ?? '';
      expect(instructions).toContain('AGENTS/app-sdk.md');
      // The existing content survives.
      expect(instructions).toContain('- Existing rule.');
    });

    it('does not duplicate the agent instructions reference', () => {
      const context = createAppContext();
      appSdk(context);
      const afterFirst = context.getFile('.config/AGENTS/instructions.md');

      appSdk(context);

      expect(context.getFile('.config/AGENTS/instructions.md')).toBe(afterFirst);
    });

    it('does not add the app-sdk guidance file when there is no instructions.md', () => {
      const context = createAppContext({ instructions: null });

      const result = appSdk(context);

      expect(result.doesFileExist('.config/AGENTS/app-sdk.md')).toBe(false);
      // The rest of the addition still applies.
      expect(result.doesFileExist('kinds/config.cue')).toBe(true);
    });
  });

  describe('feature toggle', () => {
    it('enables the app-sdk manifest toggle', () => {
      const context = createAppContext();

      const result = appSdk(context);

      expect(result.getFile('docker-compose.yaml')).toContain(
        'GF_FEATURE_TOGGLES_ENABLE: appplugins.loadAppManifest,appplugins.registerAPIServer'
      );
    });

    it('appends to existing toggles rather than replacing them', () => {
      const context = createAppContext({
        compose: `services:
  grafana:
    extends:
      file: .config/docker-compose-base.yaml
      service: grafana
    environment:
      GF_FEATURE_TOGGLES_ENABLE: someOtherToggle
`,
      });

      const result = appSdk(context);

      const compose = result.getFile('docker-compose.yaml') ?? '';
      expect(compose).toContain('someOtherToggle');
      expect(compose).toContain('appplugins.loadAppManifest');
      expect(compose).toContain('appplugins.registerAPIServer');
    });

    it('does not duplicate the toggles when they are already set', () => {
      const context = createAppContext({
        compose: `services:
  grafana:
    extends:
      file: .config/docker-compose-base.yaml
      service: grafana
    environment:
      GF_FEATURE_TOGGLES_ENABLE: appplugins.loadAppManifest,appplugins.registerAPIServer
`,
      });

      const result = appSdk(context);

      const compose = result.getFile('docker-compose.yaml') ?? '';
      expect(compose.match(/appplugins\.loadAppManifest/g)).toHaveLength(1);
      expect(compose.match(/appplugins\.registerAPIServer/g)).toHaveLength(1);
    });

    it('adds only the missing toggle when one is already set', () => {
      const context = createAppContext({
        compose: `services:
  grafana:
    extends:
      file: .config/docker-compose-base.yaml
      service: grafana
    environment:
      GF_FEATURE_TOGGLES_ENABLE: appplugins.loadAppManifest
`,
      });

      const result = appSdk(context);

      const compose = result.getFile('docker-compose.yaml') ?? '';
      expect(compose.match(/appplugins\.loadAppManifest/g)).toHaveLength(1);
      expect(compose).toContain('appplugins.registerAPIServer');
    });

    it('skips the toggles when the base compose file already enables them', () => {
      const context = createAppContext();
      context.addFile(
        '.config/docker-compose-base.yaml',
        `services:
  grafana:
    environment:
      GF_FEATURE_TOGGLES_ENABLE: appplugins.loadAppManifest,appplugins.registerAPIServer
`
      );

      const result = appSdk(context);

      expect(result.getFile('docker-compose.yaml')).toBe(STOCK_COMPOSE);
    });

    it('leaves a list-style environment block alone', () => {
      const listCompose = `services:
  grafana:
    environment:
      - GF_FEATURE_TOGGLES_ENABLE=someOtherToggle
`;
      const context = createAppContext({ compose: listCompose });

      const result = appSdk(context);

      expect(result.getFile('docker-compose.yaml')).toBe(listCompose);
      // The rest of the addition still applies.
      expect(result.doesFileExist('kinds/config.cue')).toBe(true);
    });

    it('still scaffolds when there is no docker-compose.yaml', () => {
      const context = createAppContext({ compose: null });

      const result = appSdk(context);

      expect(result.doesFileExist('kinds/config.cue')).toBe(true);
    });
  });

  describe('user messaging', () => {
    it('explains why it skipped an unsupported plugin type', () => {
      const context = createAppContext({ pluginType: 'panel' });

      appSdk(context);

      expect(output.warning).toHaveBeenCalledWith(
        expect.objectContaining({ title: expect.stringContaining('needs an app plugin') })
      );
    });

    it('prints next steps after scaffolding', () => {
      const context = createAppContext();

      appSdk(context);

      expect(output.log).toHaveBeenCalledWith(expect.objectContaining({ title: expect.stringContaining('Next steps') }));
    });

    it('stays quiet on a re-run', () => {
      const context = createAppContext();
      appSdk(context);
      vi.mocked(output.log).mockClear();

      appSdk(context);

      expect(output.log).not.toHaveBeenCalled();
    });

  });

  it('is idempotent', async () => {
    const context = createAppContext();

    await expect(appSdk).toBeIdempotent(context);
  });
});
