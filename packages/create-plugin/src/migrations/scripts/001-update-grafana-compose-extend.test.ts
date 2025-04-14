import { describe, it, expect } from 'vitest';
import { Context } from '../context.js';
import migrate from './001-update-grafana-compose-extend.js';
import { parse, stringify } from 'yaml';

describe('001-update-grafana-compose-extend', () => {
  it('should not modify anything if docker-compose.yaml does not exist', async () => {
    const context = new Context('/virtual');
    await migrate(context);
    expect(context.listChanges()).toEqual({});
  });

  it('should not modify if grafana service with correct build context is missing', async () => {
    const context = new Context('/virtual');
    context.addFile(
      './docker-compose.yaml',
      stringify({
        services: {
          grafana: {
            build: {
              context: './wrong-path',
            },
          },
        },
      })
    );
    const initialChanges = context.listChanges();
    await migrate(context);
    expect(context.listChanges()).toEqual(initialChanges);
  });

  it('should not modify if base compose file is missing', async () => {
    const context = new Context('/virtual');
    context.addFile(
      './docker-compose.yaml',
      stringify({
        services: {
          grafana: {
            build: {
              context: './.config',
            },
          },
        },
      })
    );
    const initialChanges = context.listChanges();
    await migrate(context);
    expect(context.listChanges()).toEqual(initialChanges);
  });

  it.only('should extend base config removing any duplicate config', async () => {
    const context = new Context('/virtual');
    context.addFile(
      './docker-compose.yaml',
      stringify({
        services: {
          grafana: {
            container_name: 'heywesty-trafficlight-panel',
            build: {
              context: './.config',
              args: {
                grafana_image: '${GRAFANA_IMAGE:-grafana-enterprise}',
                grafana_version: '${GRAFANA_VERSION:-9.5.3}',
              },
            },
            environment: {
              GF_INSTALL_PLUGINS: 'snuids-trafficlights-panel',
            },
            ports: ['3000:3000/tcp'],
            volumes: [
              './dist:/var/lib/grafana/plugins/heywesty-trafficlight-panel',
              './provisioning:/etc/grafana/provisioning',
            ],
          },
        },
      })
    );
    context.addFile(
      './.config/docker-compose-base.yaml',
      stringify({
        services: {
          grafana: {
            user: 'root',
            container_name: 'heywesty-trafficlight-panel',
            build: {
              context: '.',
              args: {
                grafana_image: '${GRAFANA_IMAGE:-grafana-enterprise}',
                grafana_version: '${GRAFANA_VERSION:-11.5.3}',
                development: '${DEVELOPMENT:-false}',
                anonymous_auth_enabled: '${ANONYMOUS_AUTH_ENABLED:-true}',
              },
            },
            ports: ['3000:3000/tcp'],
            volumes: [
              '../dist:/var/lib/grafana/plugins/heywesty-trafficlight-panel',
              '../provisioning:/etc/grafana/provisioning',
              '..:/root/heywesty-trafficlight-panel',
            ],
            environment: {
              NODE_ENV: 'development',
              GF_LOG_FILTERS: 'plugin.heywesty-trafficlight-panel:debug',
              GF_LOG_LEVEL: 'debug',
              GF_DATAPROXY_LOGGING: '1',
              GF_PLUGINS_ALLOW_LOADING_UNSIGNED_PLUGINS: 'heywesty-trafficlight-panel',
            },
          },
        },
      })
    );

    await migrate(context);

    const result = parse(context.getFile('./docker-compose.yaml') || '');
    expect(result.services.grafana).toEqual({
      extends: {
        file: '.config/docker-compose-base.yaml',
        service: 'grafana',
      },
      build: {
        args: {
          grafana_version: '${GRAFANA_VERSION:-9.5.3}',
        },
      },
      environment: {
        GF_INSTALL_PLUGINS: 'snuids-trafficlights-panel',
      },
    });
  });

  it('should preserve comments in the docker-compose file', async () => {
    const context = new Context('/virtual');
    const originalContent = `
# Top level comment
services:
  # Comment about grafana service
  grafana:
    # Build configuration
    build:
      context: ./.config
      args:
        grafana_image: custom-image # Inline comment
        grafana_version: 10.0.0
    # Environment configuration
    environment:
      GF_AUTH_ANONYMOUS_ENABLED: 'true' # Another inline comment
      CUSTOM_ENV: value
`;

    context.addFile('./docker-compose.yaml', originalContent);
    context.addFile(
      './.config/docker-compose-base.yaml',
      stringify({
        services: {
          grafana: {
            build: {
              context: '.',
            },
          },
        },
      })
    );

    await migrate(context);

    const migratedContent = context.getFile('./docker-compose.yaml') || '';

    // Verify comments are preserved
    expect(migratedContent).toContain('# Top level comment');
    expect(migratedContent).toContain('# Comment about grafana service');
    expect(migratedContent).toContain('# Build configuration');
    expect(migratedContent).toContain('# Inline comment');
    expect(migratedContent).toContain('# Another inline comment');

    // Verify the structure is still correct after migration
    const result = parse(migratedContent);
    expect(result.services.grafana).toEqual({
      extends: {
        file: '.config/docker-compose-base.yaml',
        service: 'grafana',
      },
      build: {
        args: {
          grafana_image: 'custom-image',
          grafana_version: '10.0.0',
        },
      },
      environment: {
        GF_AUTH_ANONYMOUS_ENABLED: 'true',
        CUSTOM_ENV: 'value',
      },
    });
  });

  it('should be idempotent', async () => {
    const context = new Context('/virtual');
    context.addFile(
      './docker-compose.yaml',
      stringify({
        services: {
          grafana: {
            build: {
              context: './.config',
              args: {
                grafana_image: 'custom-image',
                grafana_version: '10.0.0',
              },
            },
          },
        },
      })
    );
    context.addFile('./.config/docker-compose-base.yaml', 'exists');
    await expect(migrate).toBeIdempotent(context);
  });
});
