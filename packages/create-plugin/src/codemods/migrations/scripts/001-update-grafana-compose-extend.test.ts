import { describe, it, expect } from 'vitest';
import { Context } from '../../context.js';
import migrate from './001-update-grafana-compose-extend.js';
import { parse, stringify } from 'yaml';

describe('001-update-grafana-compose-extend', () => {
  it('should not modify anything if docker-compose.yaml does not exist', async () => {
    const context = new Context('/virtual');
    await migrate(context);
    expect(context.listChanges()).toEqual({});
  });

  it('should not modify anything if base compose file does not exist', async () => {
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

  it('should not modify anything if grafana service build context is not ./config', async () => {
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

  it('should not modify anything in other services', async () => {
    const context = new Context('/virtual');
    context.addFile(
      './docker-compose.yaml',
      stringify({
        services: {
          otherService: {
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

  it('should remove duplicate key value pairs', async () => {
    const context = new Context('/virtual');
    context.addFile(
      './docker-compose.yaml',
      stringify({
        services: {
          grafana: {
            build: {
              context: './.config',
            },
            container_name: 'heywesty-trafficlight-panel',
            ports: ['3000:3000/tcp'],
          },
        },
      })
    );
    context.addFile(
      './.config/docker-compose-base.yaml',
      stringify({
        services: {
          grafana: {
            build: {
              context: '.',
            },
            container_name: 'heywesty-trafficlight-panel',
            ports: ['3000:3000/tcp'],
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
    });
  });

  it('should merge volume paths that resolve to the same directory', async () => {
    const context = new Context('/virtual');
    context.addFile(
      './docker-compose.yaml',
      stringify({
        services: {
          grafana: {
            build: {
              context: './.config',
            },
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
            build: {
              context: '.',
            },
            volumes: [
              '../dist:/var/lib/grafana/plugins/heywesty-trafficlight-panel',
              '../provisioning:/etc/grafana/provisioning',
            ],
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
    });
  });

  it('should preserve volume paths that resolve to other directories', async () => {
    const context = new Context('/virtual');
    context.addFile(
      './docker-compose.yaml',
      stringify({
        services: {
          grafana: {
            build: {
              context: './.config',
            },
            volumes: [
              './another/dist:/var/lib/grafana/plugins/heywesty-trafficlight-panel',
              './provisioning:/etc/grafana/provisioning',
              './something-else:/var/lib/grafana/plugins/something-else',
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
            volumes: [
              '../dist:/var/lib/grafana/plugins/heywesty-trafficlight-panel',
              '../provisioning:/etc/grafana/provisioning',
            ],
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
      volumes: [
        './another/dist:/var/lib/grafana/plugins/heywesty-trafficlight-panel',
        './something-else:/var/lib/grafana/plugins/something-else',
      ],
    });
  });

  it('should preserve non-duplicate configuration', async () => {
    const context = new Context('/virtual');
    context.addFile(
      './docker-compose.yaml',
      stringify({
        services: {
          grafana: {
            build: {
              context: './.config',
              args: {
                grafana_version: '${GRAFANA_VERSION:-9.5.3}',
              },
            },
            environment: {
              GF_INSTALL_PLUGINS: 'snuids-trafficlights-panel',
            },
          },
        },
      })
    );
    context.addFile(
      './.config/docker-compose-base.yaml',
      stringify({
        services: {
          grafana: {
            build: {
              context: '.',
              args: {
                grafana_version: '${GRAFANA_VERSION:-11.5.3}',
              },
            },
            environment: {
              NODE_ENV: 'development',
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

  it('should remove child key-value pairs before parents', async () => {
    const context = new Context('/virtual');
    context.addFile(
      './docker-compose.yaml',
      stringify({
        services: {
          grafana: {
            build: {
              context: './.config',
              args: {
                grafana_version: '${GRAFANA_VERSION:-9.5.3}',
              },
            },
            environment: {
              GF_INSTALL_PLUGINS: 'snuids-trafficlights-panel',
              NODE_ENV: 'development',
            },
          },
        },
      })
    );
    context.addFile(
      './.config/docker-compose-base.yaml',
      stringify({
        services: {
          grafana: {
            build: {
              context: '.',
              args: {
                grafana_version: '${GRAFANA_VERSION:-11.5.3}',
              },
            },
            environment: {
              GF_INSTALL_PLUGINS: 'snuids-trafficlights-panel',
              NODE_ENV: 'development',
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
