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

  it('should update compose file and preserve build args', async () => {
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
                other_arg: 'value',
              },
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
          grafana_image: 'custom-image',
          grafana_version: '10.0.0',
        },
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

  it('should preserve environment variables not in base config', async () => {
    const context = new Context('/virtual');
    context.addFile(
      './docker-compose.yaml',
      stringify({
        services: {
          grafana: {
            build: {
              context: './.config',
            },
            environment: {
              GF_AUTH_ANONYMOUS_ENABLED: 'true',
              CUSTOM_ENV: 'value',
              BASE_ENV: 'override',
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
            },
            environment: {
              BASE_ENV: 'original',
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
      environment: {
        GF_AUTH_ANONYMOUS_ENABLED: 'true',
        CUSTOM_ENV: 'value',
      },
    });
  });
});
