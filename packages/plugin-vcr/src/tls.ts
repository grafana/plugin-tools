import { promises as fs } from 'fs';
import path from 'path';
import forge from 'node-forge';

export interface CertKeyPair {
  certPem: string;
  keyPem: string;
}

const CA_COMMON_NAME = 'Grafana plugin-vcr CA';
const CA_VALID_YEARS = 5;
const LEAF_VALID_DAYS = 825; // under the CA/Browser Forum's max leaf lifetime

/**
 * Loads a CA keypair from `caDir`, generating and persisting a new self-signed one on first run.
 * Every plugin's compose stack should get its own CA (a fresh `caDir`), so trusting one proxy's
 * cert doesn't imply trusting another plugin's recordings.
 */
export async function loadOrCreateCA(caDir: string): Promise<CertKeyPair> {
  const certPath = path.join(caDir, 'ca.pem');
  const keyPath = path.join(caDir, 'ca-key.pem');

  try {
    const [certPem, keyPem] = await Promise.all([fs.readFile(certPath, 'utf8'), fs.readFile(keyPath, 'utf8')]);
    return { certPem, keyPem };
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw err;
    }
  }

  const ca = generateCA();
  await fs.mkdir(caDir, { recursive: true });
  await fs.writeFile(certPath, ca.certPem, 'utf8');
  await fs.writeFile(keyPath, ca.keyPem, { encoding: 'utf8', mode: 0o600 });
  return ca;
}

function generateCA(): CertKeyPair {
  const keys = forge.pki.rsa.generateKeyPair(2048);
  const cert = forge.pki.createCertificate();
  cert.publicKey = keys.publicKey;
  cert.serialNumber = randomSerial();
  cert.validity.notBefore = new Date();
  cert.validity.notAfter = new Date();
  cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + CA_VALID_YEARS);

  const attrs = [{ name: 'commonName', value: CA_COMMON_NAME }];
  cert.setSubject(attrs);
  cert.setIssuer(attrs);
  cert.setExtensions([
    { name: 'basicConstraints', cA: true, critical: true },
    { name: 'keyUsage', keyCertSign: true, cRLSign: true, digitalSignature: true, critical: true },
  ]);
  cert.sign(keys.privateKey, forge.md.sha256.create());

  return {
    certPem: forge.pki.certificateToPem(cert),
    keyPem: forge.pki.privateKeyToPem(keys.privateKey),
  };
}

/**
 * Signs a short-lived leaf certificate for `host`, for MITM'ing one TLS connection. Leaf certs
 * are cheap to generate and are cached in memory by the caller (see `CertificateStore`); they
 * are never written to disk.
 */
export function signLeafCertificate(host: string, ca: { certPem: string; keyPem: string }): CertKeyPair {
  const caCert = forge.pki.certificateFromPem(ca.certPem);
  const caKey = forge.pki.privateKeyFromPem(ca.keyPem);

  const keys = forge.pki.rsa.generateKeyPair(2048);
  const cert = forge.pki.createCertificate();
  cert.publicKey = keys.publicKey;
  cert.serialNumber = randomSerial();
  cert.validity.notBefore = new Date();
  cert.validity.notAfter = new Date();
  cert.validity.notAfter.setDate(cert.validity.notBefore.getDate() + LEAF_VALID_DAYS);

  cert.setSubject([{ name: 'commonName', value: host }]);
  cert.setIssuer(caCert.subject.attributes);
  cert.setExtensions([
    { name: 'basicConstraints', cA: false, critical: true },
    { name: 'keyUsage', digitalSignature: true, keyEncipherment: true, critical: true },
    { name: 'extKeyUsage', serverAuth: true },
    {
      name: 'subjectAltName',
      altNames: [isIpAddress(host) ? { type: 7, ip: host } : { type: 2, value: host }],
    },
  ]);
  cert.sign(caKey, forge.md.sha256.create());

  return {
    certPem: forge.pki.certificateToPem(cert),
    keyPem: forge.pki.privateKeyToPem(keys.privateKey),
  };
}

/** Caches signed leaf certificates per host for the life of the process, so each host is only signed once. */
export class CertificateStore {
  private readonly cache = new Map<string, CertKeyPair>();

  constructor(private readonly ca: CertKeyPair) {}

  forHost(host: string): CertKeyPair {
    const cached = this.cache.get(host);
    if (cached) {
      return cached;
    }
    const cert = signLeafCertificate(host, this.ca);
    this.cache.set(host, cert);
    return cert;
  }
}

function isIpAddress(host: string): boolean {
  return /^\d{1,3}(\.\d{1,3}){3}$/.test(host);
}

function randomSerial(): string {
  // must not start with a byte >= 0x80 (would be read as a negative ASN.1 integer)
  return `00${forge.util.bytesToHex(forge.random.getBytesSync(16))}`;
}
