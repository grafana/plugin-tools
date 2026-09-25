import { mkdtemp, rm, writeFile, mkdir } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { findProvisionedSecrets } from './provisioning.js';

describe('findProvisionedSecrets', () => {
  let dir: string;
  const originalEnv = { ...process.env };

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'plugin-e2e-proxy-'));
    await mkdir(join(dir, 'datasources'), { recursive: true });
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
    process.env = { ...originalEnv };
  });

  it('resolves env vars referenced under secureJsonData against process.env', async () => {
    process.env.ACCESS_KEY = 'real-access-key';
    await writeFile(
      join(dir, 'datasources', 'aws.yaml'),
      'datasources:\n  - name: redshift\n    jsonData:\n      authType: keys\n    secureJsonData:\n      accessKey: $ACCESS_KEY\n'
    );

    const secrets = await findProvisionedSecrets(dir);
    expect(secrets).toEqual({ ACCESS_KEY: 'real-access-key' });
  });

  it('supports ${VAR} and ${VAR:-default} forms', async () => {
    process.env.SECRET_KEY = 'real-secret';
    await writeFile(
      join(dir, 'datasources', 'aws.yaml'),
      'datasources:\n  - name: redshift\n    secureJsonData:\n      secretKey: ${SECRET_KEY}\n      other: ${OTHER_VAR:-dummy}\n'
    );

    const secrets = await findProvisionedSecrets(dir);
    expect(secrets).toEqual({ SECRET_KEY: 'real-secret' });
  });

  it('ignores env var references outside secureJsonData', async () => {
    process.env.NOT_A_SECRET = 'should-not-be-collected';
    await writeFile(
      join(dir, 'datasources', 'aws.yaml'),
      'datasources:\n  - name: redshift\n    jsonData:\n      region: $NOT_A_SECRET\n'
    );

    const secrets = await findProvisionedSecrets(dir);
    expect(secrets).toEqual({});
  });

  it('leaves out vars that are unset or empty (dummy CI defaults)', async () => {
    delete process.env.ACCESS_KEY;
    await writeFile(
      join(dir, 'datasources', 'aws.yaml'),
      'datasources:\n  - name: redshift\n    secureJsonData:\n      accessKey: ${ACCESS_KEY:-dummy}\n'
    );

    const secrets = await findProvisionedSecrets(dir);
    expect(secrets).toEqual({});
  });

  it('returns an empty object when there is no datasources directory', async () => {
    const secrets = await findProvisionedSecrets(join(dir, 'missing'));
    expect(secrets).toEqual({});
  });
});
