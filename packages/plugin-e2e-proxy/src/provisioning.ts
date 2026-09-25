import { promises as fs } from 'fs';
import path from 'path';
import { parse as parseYml } from 'yaml';

/**
 * Reads `provisioning/datasources/*.yaml`, finds every `$VAR` / `${VAR}` / `${VAR:-default}`
 * reference under a `secureJsonData` block, and resolves each one against `process.env`.
 *
 * Returns a map of env var name to real value, for env vars that are actually set. Unset vars
 * (dummy defaults used in CI) are left out, since there's nothing to scrub.
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
    collectSecretVarNames(doc).forEach((varName) => {
      const value = process.env[varName];
      if (value !== undefined && value !== '') {
        secrets[varName] = value;
      }
    });
  }

  return secrets;
}

const VAR_REF_RE = /\$\{(\w+)(?::-.*?)?\}|\$(\w+)/g;

/** Walks every `secureJsonData` object in the parsed provisioning YAML and collects referenced env var names. */
function collectSecretVarNames(doc: unknown): Set<string> {
  const names = new Set<string>();

  function walk(node: unknown, insideSecureJsonData: boolean): void {
    if (Array.isArray(node)) {
      node.forEach((item) => walk(item, insideSecureJsonData));
      return;
    }
    if (typeof node !== 'object' || node === null) {
      if (insideSecureJsonData && typeof node === 'string') {
        for (const match of node.matchAll(VAR_REF_RE)) {
          const varName = match[1] ?? match[2];
          if (varName) {
            names.add(varName);
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
  return names;
}
