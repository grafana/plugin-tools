import { promises as fs } from 'fs';
import path from 'path';
import { parse as parseYml } from 'yaml';

/**
 * Every secret value this run knows about: env vars referenced under `secureJsonData` in
 * provisioning, plus any listed in the config's `secretEnvVars`. Keyed by env var name.
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
 * Reads `provisioning/datasources/*.yaml`, finds every `$VAR` / `${VAR}` reference under a
 * `secureJsonData` block, and resolves it from the environment. Grafana's own provisioning uses
 * Go's `os.ExpandEnv`, which has no `${VAR:-default}` fallback syntax: an unset variable expands
 * to an empty string. Scrubbing a `:-default` fallback value here would therefore scrub a word
 * Grafana never actually sent.
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
    for (const name of collectSecretVarRefs(doc)) {
      const value = process.env[name];
      if (value) {
        secrets[name] = value;
      }
    }
  }

  return secrets;
}

const VAR_REF_RE = /\$\{(\w+)\}|\$(\w+)/g;

/** Walks every `secureJsonData` object in the parsed provisioning YAML and collects the env vars it references. */
function collectSecretVarRefs(doc: unknown): Set<string> {
  const refs = new Set<string>();

  function walk(node: unknown, insideSecureJsonData: boolean): void {
    if (Array.isArray(node)) {
      node.forEach((item) => walk(item, insideSecureJsonData));
      return;
    }
    if (typeof node !== 'object' || node === null) {
      if (insideSecureJsonData && typeof node === 'string') {
        for (const match of node.matchAll(VAR_REF_RE)) {
          const name = match[1] ?? match[2];
          if (name) {
            refs.add(name);
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
