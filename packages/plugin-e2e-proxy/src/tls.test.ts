import { mkdtemp, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import forge from 'node-forge';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { CertificateStore, loadOrCreateCA, signLeafCertificate } from './tls.js';

describe('loadOrCreateCA', () => {
  let dir: string;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'plugin-e2e-proxy-ca-'));
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it('creates a self-signed CA and persists it to disk', async () => {
    const ca = await loadOrCreateCA(dir);
    const cert = forge.pki.certificateFromPem(ca.certPem);
    expect(cert.subject.getField('CN').value).toBe('Grafana plugin-e2e-proxy CA');
  });

  it('reuses the same CA on a second call', async () => {
    const first = await loadOrCreateCA(dir);
    const second = await loadOrCreateCA(dir);
    expect(second.certPem).toBe(first.certPem);
  });
});

describe('signLeafCertificate', () => {
  it('signs a leaf certificate for a host that verifies against the CA', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'plugin-e2e-proxy-ca-'));
    try {
      const ca = await loadOrCreateCA(dir);
      const leaf = signLeafCertificate('api.example.com', ca);
      const leafCert = forge.pki.certificateFromPem(leaf.certPem);
      const caCert = forge.pki.certificateFromPem(ca.certPem);

      expect(leafCert.subject.getField('CN').value).toBe('api.example.com');
      expect(caCert.verify(leafCert)).toBe(true);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});

describe('CertificateStore', () => {
  it('caches the signed certificate for a host instead of re-signing it', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'plugin-e2e-proxy-ca-'));
    try {
      const ca = await loadOrCreateCA(dir);
      const store = new CertificateStore(ca);
      const first = store.forHost('api.example.com');
      const second = store.forHost('api.example.com');
      expect(second.certPem).toBe(first.certPem);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
