import { describe, it, expect } from 'vitest';
import { Context } from '../../context.js';
import migrate from './013-enable-compose-selinux-relabel.js';
import { parse, stringify } from 'yaml';

describe('012-enable-compose-selinux-relabel', () => {
  it('should not modify anything if base compose file does not exist', async () => {
    const context = new Context('/virtual');
    context.addFile(
      './docker-compose.yaml',
      stringify({
        services: {
          grafana: {
            volumes: ['/foo:/bar'],
          },
        },
      })
    );
    const initialChanges = context.listChanges();
    await migrate(context);
    expect(context.listChanges()).toEqual(initialChanges);
  });

  it('should add :Z to all bindmounts', async () => {
    const context = new Context('/virtual');
    context.addFile(
      './.config/docker-compose-base.yaml',
      stringify({
        services: {
          grafana: {
            volumes: ['../provisioning:/etc/grafana/provisioning', '..:/root/test-plugin'],
          },
        },
      })
    );
    await migrate(context);

    const result = parse(context.getFile('./.config/docker-compose-base.yaml') || '');
    expect(result.services.grafana.volumes).toEqual([
      '../provisioning:/etc/grafana/provisioning:Z',
      '..:/root/test-plugin:Z',
    ]);
  });

  it('should modify existing bindmount opts', async () => {
    const context = new Context('/virtual');
    context.addFile(
      './.config/docker-compose-base.yaml',
      stringify({
        services: {
          grafana: {
            volumes: ['../provisioning:/etc/grafana/provisioning:ro', '..:/root/test-plugin:z'],
          },
        },
      })
    );
    await migrate(context);

    const result = parse(context.getFile('./.config/docker-compose-base.yaml') || '');
    expect(result.services.grafana.volumes).toEqual([
      '../provisioning:/etc/grafana/provisioning:roZ',
      '..:/root/test-plugin:z',
    ]);
  });

  it('should be idempotent', async () => {
    const context = new Context('/virtual');
    context.addFile(
      './.config/docker-compose-base.yaml',
      stringify({
        services: {
          grafana: {
            volumes: ['../provisioning:/etc/grafana/provisioning:Z', '..:/root/test-plugin:Z'],
          },
        },
      })
    );
    await expect(migrate).toBeIdempotent(context);
  });
});
