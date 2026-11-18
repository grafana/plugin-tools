import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';
import { Context } from '../../context.js';
import { renderTemplate } from '../../utils.js';
import migrate from './024-grafana-repository-input.js';

const DOCKERFILE_PATH = '.config/Dockerfile';
const COMPOSE_PATH = '.config/docker-compose-base.yaml';
const README_PATH = '.config/README.md';
const oldDockerfile = `ARG grafana_version=latest
ARG grafana_image=grafana-enterprise

FROM grafana/\${grafana_image}:\${grafana_version}

RUN echo "keep me"
`;
const newDockerfile = `ARG grafana_version=latest
ARG grafana_image=grafana-enterprise
ARG grafana_repository

FROM \${grafana_repository:-grafana/\${grafana_image}}:\${grafana_version}

RUN echo "keep me"
`;
const oldCompose = `services:
  grafana:
    build:
      context: .
      args:
        grafana_image: \${GRAFANA_IMAGE:-grafana-enterprise} # Keep this comment
        grafana_version: \${GRAFANA_VERSION:-latest}
    ports:
      - 3000:3000
`;
const oldReadme = `In this example, we assign the environment variable \`GRAFANA_IMAGE\` to the build arg \`grafana_image\` with a default value of \`grafana\`. This will allow you to set the value while running the docker compose commands, which might be convenient in some scenarios.

---
`;

function createContext(): Context {
  const context = new Context('/virtual');
  context.addFile(DOCKERFILE_PATH, oldDockerfile);
  context.addFile(COMPOSE_PATH, oldCompose);
  return context;
}

describe('024-grafana-repository-input', () => {
  it('should add the repository override without changing existing build args or service configuration', () => {
    const context = migrate(createContext());

    expect(context.getFile(DOCKERFILE_PATH)).toBe(newDockerfile);
    const content = context.getFile(COMPOSE_PATH)!;
    const original = parse(oldCompose);
    const updated = parse(content);
    expect(updated.services.grafana.build.args.grafana_repository).toBe('${GRAFANA_REPOSITORY:-}');
    expect(Object.keys(updated.services.grafana.build.args)).toEqual([
      'grafana_image',
      'grafana_repository',
      'grafana_version',
    ]);
    delete updated.services.grafana.build.args.grafana_repository;
    expect(updated).toEqual(original);
    expect(content).toContain('# Keep this comment');
  });

  it('should document the repository override in the existing README', () => {
    const context = createContext();
    context.addFile(README_PATH, oldReadme);

    migrate(context);

    expect(context.getFile(README_PATH)).toContain('GRAFANA_REPOSITORY=registry.example.com/team/grafana');
    expect(context.getFile(README_PATH)).toContain('If `GRAFANA_REPOSITORY` is unset or empty');
    expect(context.getFile(README_PATH)).toContain('---');
  });

  it('should preserve custom repository configuration', () => {
    const context = new Context('/virtual');
    const dockerfile = oldDockerfile.replace('grafana/${grafana_image}', 'registry.example.com/custom/grafana');
    const compose = oldCompose.replace(
      'grafana_image:',
      'grafana_repository: custom/repository\n        grafana_image:'
    );
    context.addFile(DOCKERFILE_PATH, dockerfile);
    context.addFile(COMPOSE_PATH, compose);

    migrate(context);

    expect(context.getFile(DOCKERFILE_PATH)).toBe(dockerfile);
    expect(context.getFile(COMPOSE_PATH)).toBe(compose);
  });

  it('should skip missing files', () => {
    const context = new Context('/virtual');

    expect(migrate(context).hasChanges()).toBe(false);
  });

  it.each([DOCKERFILE_PATH, COMPOSE_PATH])('should migrate %s when the other file is missing', (path) => {
    const context = new Context('/virtual');
    const content = path === DOCKERFILE_PATH ? oldDockerfile : oldCompose;
    context.addFile(path, content);

    migrate(context);

    expect(context.getFile(path)).not.toBe(content);
  });

  it.each(['services: [', 'services:\n  grafana:\n    image: custom/grafana\n'])(
    'should preserve invalid or unsupported Compose configuration',
    (content) => {
      const context = new Context('/virtual');
      context.addFile(COMPOSE_PATH, content);

      migrate(context);

      expect(context.getFile(COMPOSE_PATH)).toBe(content);
    }
  );

  it.each([false, true])('should leave the updated templates unchanged with hasBackend=%s', (hasBackend) => {
    const context = new Context('/virtual');
    for (const path of [DOCKERFILE_PATH, COMPOSE_PATH, README_PATH]) {
      const templatePath = fileURLToPath(new URL(`../../../../templates/common/${path}`, import.meta.url));
      context.addFile(
        path,
        renderTemplate(templatePath, false, { hasBackend, grafanaImage: 'grafana-enterprise', pluginId: 'test-app' })
      );
    }
    const original = structuredClone(context.listChanges());

    migrate(context);

    expect(context.listChanges()).toEqual(original);
    expect(context.getFile(DOCKERFILE_PATH)).toContain(
      'ARG grafana_repository\n\nFROM ${grafana_repository:-grafana/${grafana_image}}:${grafana_version}'
    );
    expect(parse(context.getFile(COMPOSE_PATH)!).services.grafana.build.args.grafana_repository).toBe(
      '${GRAFANA_REPOSITORY:-}'
    );
    expect(context.getFile(README_PATH)).toContain('GRAFANA_REPOSITORY=registry.example.com/team/grafana');
  });

  it('should be idempotent', async () => {
    await expect(migrate).toBeIdempotent(createContext());
  });
});
