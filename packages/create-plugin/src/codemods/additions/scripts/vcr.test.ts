import { parseDocument } from 'yaml';
import { output } from '../../../utils/utils.console.js';
import { Context } from '../../context.js';
import vcr, { PLUGIN_VCR_PACKAGE } from './vcr.js';

const STOCK_COMPOSE = `services:
  grafana:
    extends:
      file: .config/docker-compose-base.yaml
      service: grafana
`;

const AWS_GO_MOD = `module github.com/my-org/my-plugin

go 1.26.3

require (
	github.com/aws/aws-sdk-go-v2 v1.41.5
	github.com/grafana/grafana-plugin-sdk-go v0.285.0
)
`;

const GOOGLE_GO_MOD = `module github.com/my-org/my-plugin

go 1.26.3

require (
	github.com/grafana/grafana-google-sdk-go v0.4.2
	github.com/grafana/grafana-plugin-sdk-go v0.285.0
)
`;

const PLAIN_GO_MOD = `module github.com/my-org/my-plugin

go 1.26.3

require github.com/grafana/grafana-plugin-sdk-go v0.285.0
`;

const CI_WORKFLOW = `name: CI
on:
  pull_request:
jobs:
  ci:
    # keep this comment
    uses: grafana/plugin-ci-workflows/.github/workflows/ci.yml@ci-cd-workflows/v6.1.1
    with:
      run-playwright: true
`;

function createBackendContext({
  compose = STOCK_COMPOSE,
  goMod = PLAIN_GO_MOD,
  provisioning,
  workflow,
}: {
  compose?: string | null;
  goMod?: string | null;
  provisioning?: string;
  workflow?: string;
} = {}) {
  const context = new Context('/virtual');

  context.addFile('src/plugin.json', JSON.stringify({ type: 'datasource', id: 'my-plugin-id', backend: true }));
  context.addFile('package.json', JSON.stringify({ scripts: { build: 'webpack' } }, null, 2));

  if (compose !== null) {
    context.addFile('docker-compose.yaml', compose);
  }
  if (goMod !== null) {
    context.addFile('go.mod', goMod);
  }
  if (provisioning !== undefined) {
    context.addFile('provisioning/datasources/datasources.yml', provisioning);
  }
  if (workflow !== undefined) {
    context.addFile('.github/workflows/ci.yml', workflow);
  }

  return context;
}

describe('vcr addition', () => {
  beforeEach(() => {
    vi.spyOn(output, 'log').mockImplementation(() => {});
    vi.spyOn(output, 'warning').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('preconditions', () => {
    it('makes no changes for a frontend-only plugin', () => {
      const context = new Context('/virtual');
      context.addFile('src/plugin.json', JSON.stringify({ type: 'datasource', id: 'my-plugin-id', backend: false }));
      context.addFile('docker-compose.yaml', STOCK_COMPOSE);
      const changesBefore = Object.keys(context.listChanges()).length;

      const result = vcr(context);

      expect(Object.keys(result.listChanges()).length).toBe(changesBefore);
      expect(result.doesFileExist('docker-compose.vcr.yaml')).toBe(false);
    });

    it('makes no changes when there is no plugin.json', () => {
      const context = new Context('/virtual');

      const result = vcr(context);

      expect(result.listChanges()).toEqual({});
    });

    it('makes no changes when plugin.json is malformed', () => {
      const context = new Context('/virtual');
      context.addFile('src/plugin.json', '{ not json');
      const changesBefore = Object.keys(context.listChanges()).length;

      const result = vcr(context);

      expect(Object.keys(result.listChanges()).length).toBe(changesBefore);
      expect(result.doesFileExist('docker-compose.vcr.yaml')).toBe(false);
    });

    it('makes no changes when there is no docker-compose.yaml', () => {
      const context = createBackendContext({ compose: null });
      const changesBefore = Object.keys(context.listChanges()).length;

      const result = vcr(context);

      expect(Object.keys(result.listChanges()).length).toBe(changesBefore);
      expect(result.doesFileExist('docker-compose.vcr.yaml')).toBe(false);
    });

    it('makes no changes when docker-compose.yaml has no grafana service', () => {
      const context = createBackendContext({ compose: 'services:\n  other:\n    image: foo\n' });
      const changesBefore = Object.keys(context.listChanges()).length;

      const result = vcr(context);

      expect(Object.keys(result.listChanges()).length).toBe(changesBefore);
      expect(result.doesFileExist('docker-compose.vcr.yaml')).toBe(false);
    });
  });

  describe('host detection', () => {
    it('picks the aws preset from an aws-sdk-go-v2 dependency', () => {
      const context = createBackendContext({ goMod: AWS_GO_MOD });

      const result = vcr(context);

      const config = JSON.parse(result.getFile('e2e/recordings/vcr.json') ?? '{}');
      expect(config).toEqual({ preset: 'aws', hosts: ['*.amazonaws.com'] });
    });

    it('picks googleapis.com from a grafana-google-sdk-go dependency', () => {
      const context = createBackendContext({ goMod: GOOGLE_GO_MOD });

      const result = vcr(context);

      const config = JSON.parse(result.getFile('e2e/recordings/vcr.json') ?? '{}');
      expect(config).toEqual({ hosts: ['*.googleapis.com'] });
    });

    it('defaults to an empty host list when the vendor is unknown', () => {
      const context = createBackendContext();

      const result = vcr(context);

      const config = JSON.parse(result.getFile('e2e/recordings/vcr.json') ?? '{}');
      expect(config).toEqual({ hosts: [] });
    });

    it('lets an explicit hosts option override the detected hosts but keeps the preset', () => {
      const context = createBackendContext({ goMod: AWS_GO_MOD });

      const result = vcr(context, { hosts: ['api.example.com'], vcrPackage: PLUGIN_VCR_PACKAGE });

      const config = JSON.parse(result.getFile('e2e/recordings/vcr.json') ?? '{}');
      expect(config).toEqual({ preset: 'aws', hosts: ['api.example.com'] });
    });

    it('never overwrites an existing vcr.json', () => {
      const context = createBackendContext({ goMod: AWS_GO_MOD });
      context.addFile('e2e/recordings/vcr.json', JSON.stringify({ hosts: ['my.own.host'] }));

      const result = vcr(context);

      const config = JSON.parse(result.getFile('e2e/recordings/vcr.json') ?? '{}');
      expect(config).toEqual({ hosts: ['my.own.host'] });
    });
  });

  describe('secrets', () => {
    it('adds referenced env vars to both services and warns on an unsupported default', () => {
      const context = createBackendContext({
        provisioning: `apiVersion: 1
datasources:
  - name: My plugin
    type: my-plugin-id
    secureJsonData:
      apiKey: $API_KEY
      apiSecret: \${API_SECRET:-fallback}
`,
      });

      const result = vcr(context);

      const compose = result.getFile('docker-compose.vcr.yaml') ?? '';
      expect(compose).toContain('API_KEY: ${API_KEY:-dummy}');
      expect(compose).toContain('API_SECRET: ${API_SECRET:-dummy}');

      const message = result.getMessage();
      expect(message?.body?.join('\n')).toContain('API_SECRET');
    });

    it('adds no environment block to the vcr service when there are no secrets', () => {
      const context = createBackendContext();

      const result = vcr(context);

      const doc = parseDocument(result.getFile('docker-compose.vcr.yaml') ?? '');
      expect(doc.getIn(['services', 'vcr', 'environment'])).toBeUndefined();
    });
  });

  describe('scaffolding', () => {
    it('adds the config, gitignore and compose files', () => {
      const context = createBackendContext();

      const result = vcr(context);

      expect(result.doesFileExist('e2e/recordings/vcr.json')).toBe(true);
      expect(result.doesFileExist('e2e/recordings/.gitignore')).toBe(true);
      expect(result.doesFileExist('docker-compose.vcr.yaml')).toBe(true);
      expect(result.getFile('docker-compose.vcr.yaml')).toContain('extends');
      expect(result.getFile('docker-compose.vcr.yaml')).toContain(PLUGIN_VCR_PACKAGE);
    });

    it('never overwrites an existing docker-compose.vcr.yaml', () => {
      const context = createBackendContext();
      context.addFile('docker-compose.vcr.yaml', 'services:\n  vcr:\n    image: my-own-image\n');

      const result = vcr(context);

      expect(result.getFile('docker-compose.vcr.yaml')).toBe('services:\n  vcr:\n    image: my-own-image\n');
    });

    it('adds the record and replay scripts without clobbering existing ones', () => {
      const context = createBackendContext();
      context.updateFile(
        'package.json',
        JSON.stringify({ scripts: { build: 'webpack', 'server:record': 'my own thing' } }, null, 2)
      );

      const result = vcr(context);

      const packageJson = JSON.parse(result.getFile('package.json') ?? '{}');
      expect(packageJson.scripts['server:record']).toBe('my own thing');
      expect(packageJson.scripts['server:replay']).toContain('VCR_MODE=replay');
      expect(packageJson.scripts.build).toBe('webpack');
    });

    it('adds plugin-vcr as a dev dependency at the compose file version', () => {
      const context = createBackendContext();

      const result = vcr(context);

      const packageJson = JSON.parse(result.getFile('package.json') ?? '{}');
      expect(packageJson.devDependencies['@grafana/plugin-vcr']).toBe(PLUGIN_VCR_PACKAGE);
    });

    it.each([
      ['@grafana/plugin-vcr', 'latest'],
      ['@grafana/plugin-vcr@1.2.3', '1.2.3'],
    ])('derives the dev dependency version from vcrPackage %s', (vcrPackage, expected) => {
      const context = createBackendContext();

      const result = vcr(context, { vcrPackage });

      const packageJson = JSON.parse(result.getFile('package.json') ?? '{}');
      expect(packageJson.devDependencies['@grafana/plugin-vcr']).toBe(expected);
    });
  });

  describe('CI', () => {
    it('sets playwright-docker-compose-file on a plugin-ci-workflows caller and keeps comments', () => {
      const context = createBackendContext({ workflow: CI_WORKFLOW });

      const result = vcr(context);

      const workflow = result.getFile('.github/workflows/ci.yml') ?? '';
      expect(workflow).toContain('playwright-docker-compose-file: docker-compose.vcr.yaml');
      expect(workflow).toContain('# keep this comment');
      expect(workflow).toContain('run-playwright: true');
    });

    it('leaves a workflow alone that does not call plugin-ci-workflows', () => {
      const other = 'name: Lint\non:\n  push:\njobs:\n  lint:\n    uses: some/other/workflow.yml@v1\n';
      const context = createBackendContext({ workflow: other });

      const result = vcr(context);

      expect(result.getFile('.github/workflows/ci.yml')).toBe(other);
    });

    it('leaves plugin-ci-workflows callers alone that do not accept the input', () => {
      const other = `name: Release channel
on:
  push:
jobs:
  check:
    uses: grafana/plugin-ci-workflows/.github/workflows/check-release-channel.yml@main
`;
      const context = createBackendContext({ workflow: other });

      const result = vcr(context);

      expect(result.getFile('.github/workflows/ci.yml')).toBe(other);
      expect(result.getMessage()?.body?.join('\n')).toContain('docker compose -f docker-compose.vcr.yaml up');
    });

    it('keeps an existing compose file input and still shows the manual CI step', () => {
      const workflow = CI_WORKFLOW.replace(
        'run-playwright: true',
        'run-playwright: true\n      playwright-docker-compose-file: docker-compose.ci.yaml'
      );
      const context = createBackendContext({ workflow });

      const result = vcr(context);

      expect(result.getFile('.github/workflows/ci.yml')).toBe(workflow);
      expect(result.getMessage()?.body?.join('\n')).toContain('docker compose -f docker-compose.vcr.yaml up');
    });

    it('does not rewrite a workflow that is already wired', () => {
      const longLine = `echo ${'x'.repeat(130)}`;
      const workflow = `${CI_WORKFLOW}      playwright-docker-compose-file: docker-compose.vcr.yaml
  other:
    runs-on: ubuntu-latest
    steps:
      - run: ${longLine}
`;
      const context = createBackendContext({ workflow });

      const result = vcr(context);

      expect(result.getFile('.github/workflows/ci.yml')).toBe(workflow);
    });

    it('mentions the manual CI step when no workflow calls plugin-ci-workflows', () => {
      const context = createBackendContext();

      const result = vcr(context);

      const message = result.getMessage();
      expect(message?.body?.join('\n')).toContain('docker compose -f docker-compose.vcr.yaml up');
    });
  });

  it('is idempotent', async () => {
    const context = createBackendContext({
      goMod: AWS_GO_MOD,
      provisioning: `apiVersion: 1
datasources:
  - name: My plugin
    type: my-plugin-id
    secureJsonData:
      accessKey: $ACCESS_KEY
`,
      workflow: CI_WORKFLOW,
    });

    await expect(vcr).toBeIdempotent(context);
  });
});
