import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Context } from '../../context.js';
import { renderTemplate } from '../../utils.js';
import { output } from '../../../utils/utils.console.js';
import migrate from './024-oss-grafana-image.js';

const DOCKERFILE_PATH = '.config/Dockerfile';
const COMPOSE_PATH = '.config/docker-compose-base.yaml';
const README_PATH = '.config/README.md';
const CI_PATH = '.github/workflows/ci.yml';
const TEMPLATE_DATA = {
  hasBackend: true,
  grafanaImage: 'grafana',
  pluginId: 'test-app',
  packageManagerName: 'npm',
  packageManagerInstallCmd: 'npm ci',
};

function render(templatePath: string): string {
  return renderTemplate(fileURLToPath(new URL(`../../../../templates/${templatePath}`, import.meta.url)), false, {
    ...TEMPLATE_DATA,
  });
}

const newFiles: Record<string, string> = {
  [DOCKERFILE_PATH]: render('common/.config/Dockerfile'),
  [COMPOSE_PATH]: render('common/.config/docker-compose-base.yaml'),
  [README_PATH]: render('common/.config/README.md'),
  [CI_PATH]: render('github/workflows/ci.yml'),
};

// the templates as they were before the switch to the OSS image
const oldFiles: Record<string, string> = {
  [DOCKERFILE_PATH]: newFiles[DOCKERFILE_PATH].replace(
    'ARG grafana_image=grafana\n',
    'ARG grafana_image=grafana-enterprise\n'
  ),
  [COMPOSE_PATH]: newFiles[COMPOSE_PATH].replace(
    'grafana_image: ${GRAFANA_IMAGE:-grafana}',
    'grafana_image: ${GRAFANA_IMAGE:-grafana-enterprise}'
  ),
  [README_PATH]: newFiles[README_PATH].replace('By default, `grafana`', 'By default, `grafana-enterprise`')
    .replace('grafana_image: ${GRAFANA_IMAGE:-grafana-enterprise}', 'grafana_image: ${GRAFANA_IMAGE:-grafana}')
    .replace('with a default value of `grafana-enterprise`.', 'with a default value of `grafana`.'),
  [CI_PATH]: newFiles[CI_PATH].replace('e2e-version@e2e-version/v4.0.1', 'e2e-version@e2e-version/v3.0.1'),
};

function createContext(files: Record<string, string> = oldFiles): Context {
  const context = new Context('/virtual');
  Object.entries(files).forEach(([path, content]) => context.addFile(path, content));
  return context;
}

describe('024-oss-grafana-image', () => {
  beforeEach(() => {
    vi.spyOn(output, 'warning').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should derive the old fixtures from the templates', () => {
    Object.keys(newFiles).forEach((path) => {
      expect(oldFiles[path], path).not.toBe(newFiles[path]);
    });
  });

  it('should migrate every file to match the new templates', () => {
    const context = migrate(createContext());

    Object.entries(newFiles).forEach(([path, content]) => {
      expect(context.getFile(path), path).toBe(content);
    });
    expect(output.warning).not.toHaveBeenCalled();
  });

  it('should be idempotent', async () => {
    await expect(migrate).toBeIdempotent(createContext());
  });

  it('should not change already migrated files', () => {
    const context = migrate(createContext(newFiles));

    Object.entries(newFiles).forEach(([path, content]) => {
      expect(context.getFile(path), path).toBe(content);
    });
    expect(output.warning).not.toHaveBeenCalled();
  });

  it('should not change anything when the files are missing', () => {
    const context = migrate(new Context('/virtual'));

    expect(context.hasChanges()).toBe(false);
    expect(output.warning).not.toHaveBeenCalled();
  });

  it('should keep comments on the compose build arg', () => {
    const compose = oldFiles[COMPOSE_PATH].replace(
      'grafana_image: ${GRAFANA_IMAGE:-grafana-enterprise}',
      'grafana_image: ${GRAFANA_IMAGE:-grafana-enterprise} # keep me'
    );
    const context = migrate(createContext({ [COMPOSE_PATH]: compose }));

    expect(context.getFile(COMPOSE_PATH)).toContain('grafana_image: ${GRAFANA_IMAGE:-grafana} # keep me');
  });

  it('should leave custom images alone and warn', () => {
    const files = {
      [DOCKERFILE_PATH]: oldFiles[DOCKERFILE_PATH].replace(
        'grafana_image=grafana-enterprise',
        'grafana_image=my-image'
      ),
      [COMPOSE_PATH]: oldFiles[COMPOSE_PATH].replace(
        '${GRAFANA_IMAGE:-grafana-enterprise}',
        '${GRAFANA_IMAGE:-my-image}'
      ),
    };
    const context = migrate(createContext(files));

    expect(context.getFile(DOCKERFILE_PATH)).toBe(files[DOCKERFILE_PATH]);
    expect(context.getFile(COMPOSE_PATH)).toBe(files[COMPOSE_PATH]);
    expect(output.warning).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'The default Grafana image was not changed in some files' })
    );
  });

  it('should leave a customised README alone', () => {
    const readme = '### Configure grafana image to use when running docker\n\nWe use our own image.\n';
    const context = migrate(createContext({ [README_PATH]: readme }));

    expect(context.getFile(README_PATH)).toBe(readme);
  });

  it('should bump e2e-version in every workflow and leave other actions alone', () => {
    const workflow = `jobs:
  e2e:
    steps:
      - uses: grafana/plugin-actions/e2e-version@e2e-version/v1.2.1
      - uses: grafana/plugin-actions/wait-for-grafana@wait-for-grafana/v1.0.4
`;
    const context = migrate(createContext({ '.github/workflows/e2e.yaml': workflow }));

    expect(context.getFile('.github/workflows/e2e.yaml')).toBe(
      workflow.replace('e2e-version@e2e-version/v1.2.1', 'e2e-version@e2e-version/v4.0.1')
    );
  });

  it.each(['main', 'e2e-version/v4', 'e2e-version/v4.1.0'])('should not lower or warn about e2e-version@%s', (ref) => {
    const workflow = `steps:\n  - uses: grafana/plugin-actions/e2e-version@${ref}\n`;
    const context = migrate(createContext({ [CI_PATH]: workflow }));

    expect(context.getFile(CI_PATH)).toBe(workflow);
    expect(output.warning).not.toHaveBeenCalled();
  });

  it('should warn when e2e-version is pinned to a commit SHA', () => {
    const workflow =
      'steps:\n  - uses: grafana/plugin-actions/e2e-version@7c06940961370f55d9bb0e6164aed92f22d9f3b7 # e2e-version/v3.0.1\n';
    const context = migrate(createContext({ [CI_PATH]: workflow }));

    expect(context.getFile(CI_PATH)).toBe(workflow);
    expect(output.warning).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'grafana/plugin-actions/e2e-version could not be updated' })
    );
  });

  it('should warn when the root compose file overrides the image to grafana-enterprise', () => {
    const rootCompose = `services:
  grafana:
    extends:
      file: .config/docker-compose-base.yaml
      service: grafana
    build:
      args:
        grafana_image: \${GRAFANA_IMAGE:-grafana-enterprise}
`;
    const context = migrate(createContext({ ...oldFiles, 'docker-compose.yaml': rootCompose }));

    expect(context.getFile('docker-compose.yaml')).toBe(rootCompose);
    expect(output.warning).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'docker-compose.yaml uses the grafana-enterprise image' })
    );
  });
});
