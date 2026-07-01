import crypto from 'crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { postData } from './request.js';

const MANIFEST_FILE = 'MANIFEST.txt';

export interface ManifestInfo {
  // time: number;  << filled in by the server
  // keyId: string; << filled in by the server
  // signedByOrg: string; << filled in by the server
  // signedByOrgName: string; << filled in by the server
  signatureType?: string; // filled in by the server if not specified
  rootUrls?: string[]; // for private signatures
  plugin: string;
  version: string;
  files: Record<string, string>;
  signPlugin?: {
    version: string;
  };
  createPlugin?: {
    version: string;
  };
}

type RecursiveWalk = AsyncGenerator<string, void | RecursiveWalk>;

async function* walk(dir: string, baseDir: string): RecursiveWalk {
  for await (const d of await fs.opendir(dir)) {
    const entry = path.join(dir, d.name);
    if (d.isDirectory()) {
      yield* await walk(entry, baseDir);
    } else if (d.isFile()) {
      yield path.relative(baseDir, entry);
    } else if (d.isSymbolicLink()) {
      const realPath = await fs.realpath(entry);
      // A prefix check would treat sibling paths like <baseDir>-evil as inside the base directory.
      const relativeToBase = path.relative(baseDir, realPath);
      const isOutsideBaseDir =
        relativeToBase === '..' || relativeToBase.startsWith('..' + path.sep) || path.isAbsolute(relativeToBase);
      if (isOutsideBaseDir) {
        throw new Error(
          `symbolic link ${path.relative(baseDir, entry)} targets a file outside of the base directory: ${baseDir}`
        );
      }
      // if resolved symlink target is a file include it in the manifest
      const stats = await fs.stat(realPath);
      if (stats.isFile()) {
        yield path.relative(baseDir, entry);
      }
    }
  }
}

export async function buildManifest(dir: string): Promise<ManifestInfo> {
  // Canonicalize the base directory once so the symlink-escape check in `walk`
  // compares like-for-like. Without this, a dist path containing symlinks (e.g.
  // macOS `/var` -> `/private/var`) makes internal symlinks look "outside".
  const baseDir = await fs.realpath(dir);
  const pluginJson = JSON.parse(readFileSync(path.join(baseDir, 'plugin.json'), { encoding: 'utf8' }));

  const manifest = {
    plugin: pluginJson.id,
    version: pluginJson.info.version,
    files: {},
  } as ManifestInfo;

  for await (const filePath of await walk(baseDir, baseDir)) {
    if (filePath === MANIFEST_FILE) {
      continue;
    }

    // Signing plugins on Windows can create invalid paths with `\\` in the manifest
    // causing `Modified signature` errors in Grafana. Regardless of OS make sure
    // we have a posix compatible path.
    const sanitisedFilePath = filePath.split(path.sep).join(path.posix.sep);

    manifest.files[sanitisedFilePath] = crypto
      .createHash('sha256')
      .update(readFileSync(path.join(baseDir, filePath)))
      .digest('hex');
  }

  return manifest;
}

export async function signManifest(manifest: ManifestInfo, token: string): Promise<string> {
  const GRAFANA_COM_URL = process.env.GRAFANA_COM_URL || 'https://grafana.com/api';
  const url = GRAFANA_COM_URL + '/plugins/ci/sign';

  const info = await postData(url, manifest, {
    Authorization: 'Bearer ' + token,
  });

  if (info.status !== 200) {
    throw new Error(`Server responded with status code ${info.status} along with: ${formatServerError(info.data)}`);
  }

  return info.data;
}

function formatServerError(data: string): string {
  try {
    const parsed = JSON.parse(data);
    // A JSON primitive (string/number/boolean/null) has no entries to map over.
    if (parsed === null || typeof parsed !== 'object') {
      return String(parsed);
    }
    return Object.entries(parsed)
      .map(([key, value]) => `${key}: ${typeof value === 'string' ? value : JSON.stringify(value)}`)
      .join(', ');
  } catch (err) {
    return data;
  }
}

export function saveManifest(dir: string, signedManifest: string) {
  try {
    writeFileSync(path.join(dir, MANIFEST_FILE), signedManifest);
    return true;
  } catch (error) {
    throw new Error(`Failed to write signed manifest to ${dir}.`, { cause: error });
  }
}
