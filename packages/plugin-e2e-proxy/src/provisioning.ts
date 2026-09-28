import { promises as fs } from 'fs';
import path from 'path';
import { parse as parseYml } from 'yaml';

/**
 * Every secret value this run knows about: env vars referenced under `secureJsonData` in
 * provisioning, plus any listed in proxy.json's `secretEnvVars`. Keyed by env var name.
 */
export async function resolveKnownSecrets(
  provisioningRootDir: string | undefined,
  secretEnvVars: string[]
): Promise<Record<string, string>> {
  const secrets = provisioningRootDir ? await findProvisionedSecrets(provisioningRootDir) : {};
  for (const name of secretEnvVars) {
    const value = process.env[name];
    if (value) {
      secrets[name] = value;
    }
  }
  return secrets;
}

/**
 * Reads `provisioning/datasources/*.yaml`, finds every `$VAR` / `${VAR}` / `${VAR:-default}`
 * reference under a `secureJsonData` block, and resolves it the way Grafana does: the env var's
 * value, or the default when it's unset or empty. That default is the value Grafana actually sends
 * in CI, and replay needs it to normalize requests the same way the recording was.
 */
export async function findProvisionedSecrets(provisioningRootDir: string): Promise<Record<string, string>> {
  const secrets: Record<string, string> = {};
  const datasourcesDir = path.join(provisioningRootDir, 'datasources');

  let files: string[];
  try {
    files = (await fs.readdir(datasourcesDir)).filter((f) => f.endsWith('.yaml') || f.endsWith('.yml'));
  } catch {
    return secrets;
  }

  for (const file of files) {
    const raw = await fs.readFile(path.join(datasourcesDir, file), 'utf8');
    let doc: unknown;
    try {
      doc = parseYml(raw);
    } catch {
      continue;
    }
    for (const [name, fallback] of collectSecretVarRefs(doc)) {
      const value = process.env[name] || fallback;
      if (value) {
        secrets[name] = value;
      }
    }
  }

  return secrets;
}

const VAR_REF_RE = /\$\{(\w+)(?::-(.*?))?\}|\$(\w+)/g;

/** Walks every `secureJsonData` object in the parsed provisioning YAML and collects referenced env vars and their defaults. */
function collectSecretVarRefs(doc: unknown): Map<string, string | undefined> {
  const refs = new Map<string, string | undefined>();

  function walk(node: unknown, insideSecureJsonData: boolean): void {
    if (Array.isArray(node)) {
      node.forEach((item) => walk(item, insideSecureJsonData));
      return;
    }
    if (typeof node !== 'object' || node === null) {
      if (insideSecureJsonData && typeof node === 'string') {
        for (const match of node.matchAll(VAR_REF_RE)) {
          const name = match[1] ?? match[3];
          if (name) {
            refs.set(name, match[2]);
          }
        }
      }
      return;
    }
    for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
      walk(value, insideSecureJsonData || key === 'secureJsonData');
    }
  }

  walk(doc, false);
  return refs;
}
