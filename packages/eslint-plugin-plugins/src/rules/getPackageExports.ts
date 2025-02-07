import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { tmpdir } from 'os';
import { execSync } from 'child_process';
import { lt } from 'semver';
import { getExportInfo } from './tscUtils';
import { ExportInfo } from './types';

const packages = ['@grafana/data', '@grafana/ui', '@grafana/runtime'];

// This function needs to be async to block eslint until the types files for the Grafana packages are downloaded.
// Before Grafana 9.2 bundles didn't have a dist directory and types files were scattered across the package. For
// this reason we need to install the packages to get all the types files. Starting from Grafana 9.2, types files
// are bundled in the dist directory as a single file so we can download only the index.d.ts file to speed up the process.

export function downloadPackages(tempDir: string, version: string) {
  console.log(`Please wait... downloading Grafana types information for version ${version}.`);
  mkdirSync(tempDir, { recursive: true });

  if (lt(version, '9.2.0')) {
    execSync(
      `npm install ${packages.join(
        `@${version} `
      )} --legacy-peer-deps --ignore-scripts --no-save --omit=optional --omit=dev --omit=peer --loglevel=error`,
      {
        cwd: tempDir,
      }
    );
  } else {
    packages.forEach((pkgName) => {
      let typesFileUrl = `https://cdn.jsdelivr.net/npm/${pkgName}@${version}/dist/index.d.ts`;
      let downloadPath = join(tempDir, 'node_modules', pkgName);
      mkdirSync(downloadPath, { recursive: true });

      try {
        execSync(
          `node -e "const https = require('https'); https.get('${typesFileUrl}', (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
              if (res.statusCode === 200) {
                require('fs').writeFileSync('${join(downloadPath, `index.d.ts`)}', data);
                process.exit(0);
              }
              console.error('Failed to download ${pkgName}: HTTP status ' + res.statusCode);
              process.exit(1);
            });
          }).on('error', (e) => {
            console.error('Failed to download ${pkgName}: ' + e.message);
            process.exit(1);
          })"`
        );
      } catch (error) {
        if (error instanceof Error) {
          throw new Error(`Failed to download types for ${pkgName}@${version}: ${error.message}`);
        }
      }
    });
  }
}

function getPackageExportPaths(tempDir: string): Record<string, string> {
  return packages.reduce(
    (acc, pkg) => ({
      ...acc,
      [pkg]: join(tempDir, 'node_modules', pkg, 'index.d.ts'),
    }),
    {}
  );
}

export function getPackageExports(minGrafanaVersion: string): Record<string, ExportInfo> {
  const tempDir = join(tmpdir(), `gf-eslint-plugin-compatible-${minGrafanaVersion}`);

  if (!existsSync(tempDir)) {
    downloadPackages(tempDir, minGrafanaVersion);
  }

  const packagePaths = getPackageExportPaths(tempDir);

  return Object.entries(packagePaths).reduce(
    (acc, [pkg, path]) => ({
      ...acc,
      [pkg]: getExportInfo(path),
    }),
    {}
  );
}
