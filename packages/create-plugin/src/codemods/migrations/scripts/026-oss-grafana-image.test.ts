import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Context } from '../../context.js';
import { output } from '../../../utils/utils.console.js';
import migrate from './026-oss-grafana-image.js';

const DOCKERFILE_PATH = '.config/Dockerfile';
const COMPOSE_PATH = '.config/docker-compose-base.yaml';
const CI_PATH = '.github/workflows/ci.yml';

const oldFiles: Record<string, string> = {
  [DOCKERFILE_PATH]: `ARG grafana_version=latest
ARG grafana_image=grafana-enterprise
ARG grafana_repository

FROM \${grafana_repository:-grafana/\${grafana_image}}:\${grafana_version}
`,
  [COMPOSE_PATH]: `services:
  grafana:
    build:
      context: .
      args:
        grafana_image: \${GRAFANA_IMAGE:-grafana-enterprise}
        grafana_repository: \${GRAFANA_REPOSITORY:-}
        grafana_version: \${GRAFANA_VERSION:-13.2.4}
    ports:
      - 3000:3000/tcp
`,
  [CI_PATH]: `jobs:
  resolve-versions:
    steps:
      - name: Resolve Grafana E2E versions
        id: resolve-versions
        uses: grafana/plugin-actions/e2e-version@e2e-version/v3.2.4
`,
};

const newFiles: Record<string, string> = {
  [DOCKERFILE_PATH]: oldFiles[DOCKERFILE_PATH].replace(
    'ARG grafana_image=grafana-enterprise',
    'ARG grafana_image=grafana'
  ),
  [COMPOSE_PATH]: oldFiles[COMPOSE_PATH].replace('${GRAFANA_IMAGE:-grafana-enterprise}', '${GRAFANA_IMAGE:-grafana}'),
  [CI_PATH]: oldFiles[CI_PATH].replace('e2e-version@e2e-version/v3.2.4', 'e2e-version@e2e-version/v4.0.1'),
};

function createContext(files: Record<string, string> = oldFiles): Context {
  const context = new Context('/virtual');
  Object.entries(files).forEach(([path, content]) => context.addFile(path, content));
  return context;
}

describe('026-oss-grafana-image', () => {
  beforeEach(() => {
    vi.spyOn(output, 'warning').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should switch the image and bump e2e-version', () => {
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

  it('should keep the formatting of the rest of the compose file', () => {
    const compose = `services:
  grafana:
    build:
      args:
        grafana_image: \${GRAFANA_IMAGE:-grafana-enterprise}
    ports:
    - 3000:3000/tcp
    environment:
      GF_INSTALL_PLUGINS: ${'a'.repeat(100)} ${'b'.repeat(30)}
      FOO:   bar
`;
    const context = migrate(createContext({ [COMPOSE_PATH]: compose }));

    expect(context.getFile(COMPOSE_PATH)).toBe(
      compose.replace('${GRAFANA_IMAGE:-grafana-enterprise}', '${GRAFANA_IMAGE:-grafana}')
    );
  });

  it('should warn when a customised base compose file keeps the grafana-enterprise image', () => {
    const compose = oldFiles[COMPOSE_PATH].replace('${GRAFANA_IMAGE:-grafana-enterprise}', 'grafana-enterprise');
    const context = migrate(createContext({ [COMPOSE_PATH]: compose }));

    expect(context.getFile(COMPOSE_PATH)).toBe(compose);
    expect(output.warning).toHaveBeenCalledWith(
      expect.objectContaining({ title: '.config/docker-compose-base.yaml uses the grafana-enterprise image' })
    );
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
