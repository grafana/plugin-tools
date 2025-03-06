import crypto from 'crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { postData } from './request.js';
import { output } from './utils.output.js';
import chalk from 'chalk';

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
      if (!realPath.startsWith(baseDir)) {
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
  const pluginJson = JSON.parse(readFileSync(path.join(dir, 'plugin.json'), { encoding: 'utf8' }));

  const manifest = {
    plugin: pluginJson.id,
    version: pluginJson.info.version,
    files: {},
  } as ManifestInfo;

  for await (const filePath of await walk(dir, dir)) {
    if (filePath === MANIFEST_FILE) {
      continue;
    }

    // Signing plugins on Windows can create invalid paths with `\\` in the manifest
    // causing `Modified signature` errors in Grafana. Regardless of OS make sure
    // we have a posix compatible path.
    const sanitisedFilePath = filePath.split(path.sep).join(path.posix.sep);

    manifest.files[sanitisedFilePath] = crypto
      .createHash('sha256')
      .update(readFileSync(path.join(dir, filePath)))
      .digest('hex');
  }

  return manifest;
}

export async function signManifest(manifest: ManifestInfo): Promise<string> {
  const GRAFANA_API_KEY = process.env.GRAFANA_API_KEY;
  const GRAFANA_ACCESS_POLICY_TOKEN = process.env.GRAFANA_ACCESS_POLICY_TOKEN;

  if (!GRAFANA_ACCESS_POLICY_TOKEN && !GRAFANA_API_KEY) {
    output.error({
      title: 'Missing GRAFANA_ACCESS_POLICY_TOKEN.',
      body: ['You must create a GRAFANA_ACCESS_POLICY_TOKEN env variable to sign plugins.'],
      link: 'https://grafana.com/developers/plugin-tools/publish-a-plugin/sign-a-plugin#generate-an-access-policy-token',
    });
    process.exit(1);
  }
  if (GRAFANA_API_KEY) {
    output.warning({
      title: 'Usage of GRAFANA_API_KEY is deprecated.',
      body: ['Please migrate to using a GRAFANA_ACCESS_POLICY_TOKEN instead.'],
      link: 'https://grafana.com/developers/plugin-tools/publish-a-plugin/sign-a-plugin',
    });
  }

  const GRAFANA_COM_URL = process.env.GRAFANA_COM_URL || 'https://grafana.com/api';
  const url = GRAFANA_COM_URL + '/plugins/ci/sign';

  const token = GRAFANA_ACCESS_POLICY_TOKEN ? GRAFANA_ACCESS_POLICY_TOKEN : GRAFANA_API_KEY;
  try {
    const info = await postData(url, manifest, {
      Authorization: 'Bearer ' + token,
    });
    if (info.status !== 200) {
      const dataAsArray = Object.entries(JSON.parse(info.data)).map(([key, value]) => `${key}: ${value}`);
      output.error({
        title: 'Error signing manifest.',
        body: [
          `Server responded with status code ${chalk.yellow(info.status)} along with:`,
          ...output.bulletList(dataAsArray),
        ],
      });
      process.exit(1);
    }

    return info.data;
  } catch (err: any) {
    const body = err.response?.data?.message ? [err.response.data.message] : [err.message];
    output.error({
      title: 'Error signing manifest.',
      body,
    });
    process.exit(1);
  }
}

export function saveManifest(dir: string, signedManifest: string) {
  try {
    writeFileSync(path.join(dir, MANIFEST_FILE), signedManifest);
    return true;
  } catch (error) {
    output.error({
      title: 'Error saving manifest',
      body: [`Failed to write signed manifest to ${dir}.`],
    });
    process.exit(1);
  }
}
