import { getImportsInfo } from '@grafana/levitate';
import { EntryPointConfig, generateDtsBundle } from 'jackw-dts-bundle-gen-test';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

export const generateTypes = (entrypoint: string) => {
  const inlinedLibraries = getImportedPackages(entrypoint);

  const entryPoints: EntryPointConfig[] = [
    {
      filePath: entrypoint,
      libraries: {
        inlinedLibraries,
      },
      output: {
        exportReferencedTypes: false,
      },
    },
  ];

  const options = {
    preferredConfigPath: resolve(process.cwd(), 'tsconfig.json'),
  };

  const dts = generateDtsBundle(entryPoints, options);
  const cleanedDts = cleanDTS(dts);
  // TODO: Add a cli arg to specify the output path??
  writeFileSync('./dist/index.d.ts', cleanedDts);
};

export function getImportedPackages(entryFile: string) {
  const { imports } = getImportsInfo(entryFile);

  return imports.map((importInfo) => importInfo.packageName);
}

function cleanDTS(dtsContent: string[]) {
  let dtsString = dtsContent.join('\n');
  dtsString = dtsString.replace('export {};', '');
  return dtsString.trim() + '\n';
}
