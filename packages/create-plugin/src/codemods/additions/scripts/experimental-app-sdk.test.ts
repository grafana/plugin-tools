import { Context } from '../../context.js';
import { output } from '../../../utils/utils.console.js';
import appSdk from './experimental-app-sdk.js';

// renderTemplate resolves hasBackend (and other plugin state) via getPluginJson, which reads real
// disk rather than the codemod's in-memory Context. Mirror that value here, kept in sync with each
// test's createAppContext({ hasBackend }) below, so templates render as they would for the plugin
// actually under test. Declared via vi.hoisted since the vi.mock factories below are hoisted above
// ordinary top-level declarations.
const mockedState = vi.hoisted(() => ({ hasBackend: false }));

vi.mock(import('../../../utils/utils.plugin.js'), async (importOriginal) => {
  const originalModule = await importOriginal();
  return {
    ...originalModule,
    getPluginJson: () => ({
      id: 'my-plugin-id',
      name: 'My Plugin',
      info: { author: { name: 'my-author' } },
      backend: mockedState.hasBackend,
    }),
  };
});

vi.mock(import('../../utils.js'), async (importOriginal) => {
  const originalModule = await importOriginal();
  // Disk I/O is slow so render each template once per includeWarning/hasBackend combination, keyed
  // off the requested path.
  const render = (file: string, includeWarning: boolean, hasBackend: boolean) => {
    mockedState.hasBackend = hasBackend;
    return originalModule.renderTemplate(
      new URL(`../../../../templates/app-sdk/${file}`, import.meta.url).pathname,
      includeWarning
    );
  };
  const files = [
    '.config/app-sdk/generate-kinds.mjs',
    '.config/app-sdk/README.md',
    '.config/AGENTS/app-sdk.md',
    '.github/workflows/generate-kinds-drift.yml',
    'kinds/config.cue',
    'kinds/manifest.cue',
    'kinds/example.cue',
    'kinds/cue.mod/module.cue',
    'kinds/README.md',
    'pkg/provider/provider.go',
  ];
  const rendered: Record<string, Record<'true' | 'false', { withoutBackend: string; withBackend: string }>> =
    Object.fromEntries(
      files.map((file) => [
        file,
        {
          true: { withoutBackend: render(file, true, false), withBackend: render(file, true, true) },
          false: { withoutBackend: render(file, false, false), withBackend: render(file, false, true) },
        },
      ])
    );
  mockedState.hasBackend = false;

  return {
    ...originalModule,
    renderTemplate: (templatePath: string, includeWarning = false) => {
      const match = Object.keys(rendered).find((file) => templatePath.endsWith(file));

      if (!match) {
        return '';
      }

      const variant = rendered[match][includeWarning ? 'true' : 'false'];
      return mockedState.hasBackend ? variant.withBackend : variant.withoutBackend;
    },
  };
});

const APP_SDK_FILES = [
  '.config/app-sdk/generate-kinds.mjs',
  '.config/app-sdk/README.md',
  '.config/AGENTS/app-sdk.md',
  '.github/workflows/generate-kinds-drift.yml',
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
  hasBackend = false,
}: {
  pluginType?: string;
  compose?: string | null;
  instructions?: string | null;
  hasBackend?: boolean;
} = {}) {
  mockedState.hasBackend = hasBackend;

  const context = new Context('/virtual');

  context.addFile('src/plugin.json', JSON.stringify({ type: pluginType, id: 'my-plugin-id', backend: hasBackend }));
  context.addFile('package.json', JSON.stringify({ scripts: { build: 'webpack' } }, null, 2));
  context.addFile('.gitignore', 'node_modules/\ndist/\n');
  context.addFile('.config/bundler/copyFiles.ts', `export const copyFilePatterns = ['**/*.json'];`);

  if (instructions !== null) {
    context.addFile('.config/AGENTS/instructions.md', instructions);
  }

  if (compose !== null) {
    context.addFile('docker-compose.yaml', compose);
  }

  if (hasBackend) {
    context.addFile('pkg/main.go', BACKEND_MAIN_GO);
    context.addFile('go.mod', BACKEND_GO_MOD);
  }

  return context;
}

const BACKEND_GO_MOD = `module github.com/my-org/my-plugin


go 1.26.3

require github.com/grafana/grafana-plugin-sdk-go v0.285.0

require (
	github.com/BurntSushi/toml v1.5.0 // indirect
)
`;

const BACKEND_MAIN_GO = `package main

import (
	"os"

	"github.com/grafana/grafana-plugin-sdk-go/backend/app"
	"github.com/grafana/grafana-plugin-sdk-go/backend/log"
	"github.com/my-org/my-plugin/pkg/plugin"
)

func main() {
	// Start listening to requests sent from Grafana. This call is blocking so
	// it won't finish until Grafana shuts down the process or the plugin choose
	// to exit by itself using os.Exit. Manage automatically manages life cycle
	// of app instances. It accepts app instance factory as first
	// argument. This factory will be automatically called on incoming request
	// from Grafana to create different instances of \`App\` (per plugin
	// ID).
	if err := app.Manage("my-plugin-id", plugin.NewApp, app.ManageOpts{}); err != nil {
		log.DefaultLogger.Error(err.Error())
		os.Exit(1)
	}
}
`;

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

    it('marks generate-kinds.mjs as scaffolded but leaves the editable CUE kinds unmarked', () => {
      const context = createAppContext();

      const result = appSdk(context);

      expect(result.getFile('.config/app-sdk/generate-kinds.mjs')).toContain('DO NOT EDIT THIS FILE DIRECTLY');
      expect(result.getFile('kinds/config.cue')).not.toContain('DO NOT EDIT THIS FILE DIRECTLY');
      expect(result.getFile('kinds/manifest.cue')).not.toContain('DO NOT EDIT THIS FILE DIRECTLY');
      expect(result.getFile('kinds/example.cue')).not.toContain('DO NOT EDIT THIS FILE DIRECTLY');
      expect(result.getFile('.github/workflows/generate-kinds-drift.yml')).not.toContain('DO NOT EDIT THIS FILE DIRECTLY');
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

  describe('Go backend wiring', () => {
    it('leaves Go code generation disabled when there is no backend', () => {
      const context = createAppContext({ hasBackend: false });

      const result = appSdk(context);

      expect(result.getFile('kinds/config.cue')).toContain('goEnabled: false');
      expect(result.doesFileExist('pkg/main.go')).toBe(false);
    });

    it('enables Go code generation and sets a Go output path when a backend is present', () => {
      const context = createAppContext({ hasBackend: true });

      const result = appSdk(context);

      const config = result.getFile('kinds/config.cue') ?? '';
      expect(config).toContain('goEnabled: true');
      expect(config).toContain('goGenPath: "pkg/generated/"');
      expect(config).not.toContain('goEnabled: false');
    });

    it('scaffolds pkg/provider/provider.go with the app.Provider wiring', () => {
      const context = createAppContext({ hasBackend: true });

      const result = appSdk(context);

      const providerGo = result.getFile('pkg/provider/provider.go') ?? '';
      expect(providerGo).toContain('"github.com/grafana/grafana-app-sdk/app"');
      expect(providerGo).toContain('func New() app.Provider');
      expect(providerGo).toContain('simple.NewAppProvider(manifestdata.LocalManifest(), nil, newApp)');
    });

    it('does not scaffold pkg/provider/provider.go when there is no Go backend', () => {
      const context = createAppContext({ hasBackend: false });

      const result = appSdk(context);

      expect(result.doesFileExist('pkg/provider/provider.go')).toBe(false);
    });

    it('does not overwrite an existing pkg/provider/provider.go', () => {
      const context = createAppContext({ hasBackend: true });
      const userProviderGo = 'package provider\n\n// my own provider\n';
      context.addFile('pkg/provider/provider.go', userProviderGo);

      const result = appSdk(context);

      expect(result.getFile('pkg/provider/provider.go')).toBe(userProviderGo);
    });

    it('wires plugin.Run into main.go', () => {
      const context = createAppContext({ hasBackend: true });

      const result = appSdk(context);

      const mainGo = result.getFile('pkg/main.go') ?? '';
      expect(mainGo).toContain('sdkplugin "github.com/grafana/grafana-app-sdk/plugin"');
      expect(mainGo).toContain('"github.com/my-org/my-plugin/pkg/provider"');
      expect(mainGo).toContain('sdkplugin.Run(');
      expect(mainGo).toContain('provider.New()');
      // The original app.Manage call's plugin ID and app factory are preserved as Run options.
      expect(mainGo).toContain('sdkplugin.WithPluginID("my-plugin-id")');
      expect(mainGo).toContain('sdkplugin.WithAppFunc(plugin.NewApp)');
      expect(mainGo).not.toContain('app.Manage(');
    });

    it('does not modify main.go when there is no Go backend', () => {
      const context = createAppContext({ hasBackend: false });

      const result = appSdk(context);

      expect(result.doesFileExist('pkg/main.go')).toBe(false);
    });

    it('does not duplicate the wiring on a re-run', () => {
      const context = createAppContext({ hasBackend: true });
      appSdk(context);
      const afterFirst = context.getFile('pkg/main.go');

      appSdk(context);

      expect(context.getFile('pkg/main.go')).toBe(afterFirst);
      expect((context.getFile('pkg/main.go') ?? '').match(/sdkplugin "github\.com\/grafana\/grafana-app-sdk\/plugin"/g)).toHaveLength(1);
    });

    it('skips main.go safely when it does not match the expected shape', () => {
      const context = createAppContext({ hasBackend: true });
      const customMainGo = `package main

func main() {
	// heavily customized, no app.Manage call left
}
`;
      context.updateFile('pkg/main.go', customMainGo);

      const result = appSdk(context);

      expect(result.getFile('pkg/main.go')).toBe(customMainGo);
      expect(output.warning).toHaveBeenCalledWith(
        expect.objectContaining({ title: expect.stringContaining('does not match the expected app.Manage') })
      );
    });

    it('is idempotent with a Go backend present', async () => {
      const context = createAppContext({ hasBackend: true });

      await expect(appSdk).toBeIdempotent(context);
    });

    it('adds the grafana-app-sdk dependency to go.mod', () => {
      const context = createAppContext({ hasBackend: true });

      const result = appSdk(context);

      const goMod = result.getFile('go.mod') ?? '';
      expect(goMod).toContain('require github.com/grafana/grafana-app-sdk v');
      // The existing require survives.
      expect(goMod).toContain('require github.com/grafana/grafana-plugin-sdk-go v0.285.0');
    });

    it('does not duplicate the go.mod dependency on a re-run', () => {
      const context = createAppContext({ hasBackend: true });
      appSdk(context);
      const afterFirst = context.getFile('go.mod');

      appSdk(context);

      expect(context.getFile('go.mod')).toBe(afterFirst);
      expect((context.getFile('go.mod') ?? '').match(/github\.com\/grafana\/grafana-app-sdk /g)).toHaveLength(1);
    });

    it('tells the user to run go mod tidy when a Go backend is present', () => {
      const context = createAppContext({ hasBackend: true });

      appSdk(context);

      expect(output.log).toHaveBeenCalledWith(expect.objectContaining({ body: expect.arrayContaining(['  go mod tidy']) }));
    });

    it('tells the user to generate:kinds before go mod tidy, since provider.go imports generated packages', () => {
      const context = createAppContext({ hasBackend: true });

      appSdk(context);

      const body = vi.mocked(output.log).mock.calls[0][0].body ?? [];
      const generateIndex = body.indexOf('  npm run generate:kinds');
      const tidyIndex = body.indexOf('  go mod tidy');
      expect(generateIndex).toBeGreaterThanOrEqual(0);
      expect(tidyIndex).toBeGreaterThan(generateIndex);
    });

    it('does not mention go mod tidy without a Go backend', () => {
      const context = createAppContext({ hasBackend: false });

      appSdk(context);

      expect(output.log).toHaveBeenCalledWith(
        expect.objectContaining({ body: expect.not.arrayContaining(['  go mod tidy']) })
      );
    });
  });
});
