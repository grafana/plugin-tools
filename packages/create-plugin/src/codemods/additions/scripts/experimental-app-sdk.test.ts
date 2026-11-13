import { Context } from '../../context.js';
import { output } from '../../../utils/utils.console.js';
import appSdk from './experimental-app-sdk.js';

vi.mock(import('../../../utils/utils.packageManager.js'), async (importOriginal) => ({
  ...(await importOriginal()),
  getPackageManagerWithFallback: () => ({ packageManagerName: 'npm', packageManagerVersion: '10.9.0' }),
}));

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
  const context = new Context('/virtual');

  context.addFile(
    'src/plugin.json',
    JSON.stringify({
      type: pluginType,
      id: 'my-plugin-id',
      name: 'My Plugin',
      info: { author: { name: 'my-author' } },
      backend: hasBackend,
    })
  );
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

    it('explains a missing author name instead of failing while rendering', () => {
      const context = createAppContext();
      context.updateFile('src/plugin.json', JSON.stringify({ type: 'app', id: 'my-plugin-id', name: 'My Plugin' }));

      expect(() => appSdk(context)).toThrow('src/plugin.json has no info.author.name');
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
      expect(result.getFile('.github/workflows/generate-kinds-drift.yml')).not.toContain(
        'DO NOT EDIT THIS FILE DIRECTLY'
      );
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

  describe('grafana version override', () => {
    it('adds the image and version build args', () => {
      const result = appSdk(createAppContext());

      const compose = result.getFile('docker-compose.yaml') ?? '';
      expect(compose).toContain('grafana_image: ${GRAFANA_IMAGE:-grafana}');
      expect(compose).toContain('grafana_version: ${GRAFANA_VERSION:-nightly}');
    });

    it('adds the build args even when the base compose file already enables the toggles', () => {
      const context = createAppContext();
      context.addFile(
        '.config/docker-compose-base.yaml',
        `services:
  grafana:
    environment:
      GF_FEATURE_TOGGLES_ENABLE: appplugins.loadAppManifest,appplugins.registerAPIServer,grafana.useRouterMiddleware
`
      );

      const result = appSdk(context);

      expect(result.getFile('docker-compose.yaml')).toContain('grafana_version: ${GRAFANA_VERSION:-nightly}');
    });

    it('keeps build args the user already set', () => {
      const context = createAppContext({
        compose: `services:
  grafana:
    extends:
      file: .config/docker-compose-base.yaml
      service: grafana
    build:
      args:
        grafana_version: 12.0.0
`,
      });

      const result = appSdk(context);

      const compose = result.getFile('docker-compose.yaml') ?? '';
      expect(compose).toContain('grafana_version: 12.0.0');
      expect(compose).not.toContain('GRAFANA_VERSION');
      expect(compose).toContain('grafana_image: ${GRAFANA_IMAGE:-grafana}');
    });

    it('is idempotent', () => {
      const once = appSdk(createAppContext());
      const compose = once.getFile('docker-compose.yaml');

      const twice = appSdk(once);

      expect(twice.getFile('docker-compose.yaml')).toBe(compose);
    });
  });

  describe('feature toggle', () => {
    it('enables the app-sdk manifest toggle', () => {
      const context = createAppContext();

      const result = appSdk(context);

      expect(result.getFile('docker-compose.yaml')).toContain(
        'GF_FEATURE_TOGGLES_ENABLE: appplugins.loadAppManifest,appplugins.registerAPIServer,grafana.useRouterMiddleware'
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
      expect(compose).toContain('grafana.useRouterMiddleware');
    });

    it('does not duplicate the toggles when they are already set', () => {
      const context = createAppContext({
        compose: `services:
  grafana:
    extends:
      file: .config/docker-compose-base.yaml
      service: grafana
    environment:
      GF_FEATURE_TOGGLES_ENABLE: appplugins.loadAppManifest,appplugins.registerAPIServer,grafana.useRouterMiddleware
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
      GF_FEATURE_TOGGLES_ENABLE: appplugins.loadAppManifest,appplugins.registerAPIServer,grafana.useRouterMiddleware
`
      );

      const result = appSdk(context);

      expect(result.getFile('docker-compose.yaml')).not.toContain('GF_FEATURE_TOGGLES_ENABLE');
    });

    it('leaves a list-style environment block alone', () => {
      const listCompose = `services:
  grafana:
    environment:
      - GF_FEATURE_TOGGLES_ENABLE=someOtherToggle
`;
      const context = createAppContext({ compose: listCompose });

      const result = appSdk(context);

      expect(result.getFile('docker-compose.yaml')).toContain('- GF_FEATURE_TOGGLES_ENABLE=someOtherToggle');
      expect(result.getFile('docker-compose.yaml')).not.toContain('appplugins.loadAppManifest');
      // The rest of the addition still applies.
      expect(result.doesFileExist('kinds/config.cue')).toBe(true);
    });

    it('still scaffolds when there is no docker-compose.yaml', () => {
      const context = createAppContext({ compose: null });

      const result = appSdk(context);

      expect(result.doesFileExist('kinds/config.cue')).toBe(true);
    });

    it('still scaffolds the kinds when there is no package.json', () => {
      const context = createAppContext();
      context.deleteFile('package.json');

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

      const body = context.getMessage()?.body ?? [];
      expect(body.some((line) => line.includes('Next steps'))).toBe(true);
    });

    it('does not set a new message on a re-run', () => {
      const context = createAppContext();
      appSdk(context);
      const messageAfterFirstRun = context.getMessage();

      appSdk(context);

      // A re-run makes no changes, so it never calls setMessage again; the message from the first
      // run is untouched rather than replaced or cleared.
      expect(context.getMessage()).toBe(messageAfterFirstRun);
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

    it('scaffolds pkg/generated stub packages so go mod tidy resolves provider.go imports', () => {
      const context = createAppContext({ hasBackend: true });

      const result = appSdk(context);

      expect(result.doesFileExist('pkg/generated/example/v1alpha1/doc.go')).toBe(true);
      expect(result.doesFileExist('pkg/generated/manifestdata/doc.go')).toBe(true);
    });

    it('does not scaffold pkg/generated stubs when there is no Go backend', () => {
      const context = createAppContext({ hasBackend: false });

      const result = appSdk(context);

      expect(result.doesFileExist('pkg/generated/example/v1alpha1/doc.go')).toBe(false);
      expect(result.doesFileExist('pkg/generated/manifestdata/doc.go')).toBe(false);
    });

    it('does not overwrite existing pkg/generated stubs', () => {
      const context = createAppContext({ hasBackend: true });
      const userStub = 'package v1alpha1\n\n// hand-edited after real codegen\n';
      context.addFile('pkg/generated/example/v1alpha1/doc.go', userStub);

      const result = appSdk(context);

      expect(result.getFile('pkg/generated/example/v1alpha1/doc.go')).toBe(userStub);
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
      expect(
        (context.getFile('pkg/main.go') ?? '').match(/sdkplugin "github\.com\/grafana\/grafana-app-sdk\/plugin"/g)
      ).toHaveLength(1);
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

    it('does not tell the user to run go mod tidy, since the codemod runner already ran it', () => {
      const context = createAppContext({ hasBackend: true });

      appSdk(context);

      const body = context.getMessage()?.body ?? [];
      expect(body.some((line) => line.includes('go mod tidy'))).toBe(false);
    });

    it('does not mention go mod tidy without a Go backend', () => {
      const context = createAppContext({ hasBackend: false });

      appSdk(context);

      const body = context.getMessage()?.body ?? [];
      expect(body.some((line) => line.includes('go mod tidy'))).toBe(false);
    });

    it('tells the user to rebuild the backend after generating kinds, when a Go backend is present', () => {
      const context = createAppContext({ hasBackend: true });

      appSdk(context);

      const body = context.getMessage()?.body ?? [];
      const generateIndex = body.findIndex((line) => line.includes('generate:kinds'));
      const buildIndex = body.findIndex((line) => line.includes('mage'));
      expect(buildIndex).toBeGreaterThanOrEqual(0);
      expect(buildIndex).toBeGreaterThan(generateIndex);
    });

    it('does not tell the user to rebuild a Go backend that does not exist', () => {
      const context = createAppContext({ hasBackend: false });

      appSdk(context);

      const body = context.getMessage()?.body ?? [];
      expect(body.some((line) => line.includes('mage'))).toBe(false);
    });

    it('tells the user to restart grafana to pick up the manifest', () => {
      const context = createAppContext();

      appSdk(context);

      const body = context.getMessage()?.body ?? [];
      expect(body.some((line) => line.includes('docker compose restart grafana'))).toBe(true);
    });
  });
});
