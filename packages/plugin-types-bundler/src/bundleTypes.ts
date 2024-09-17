import { getImportsInfo } from '@grafana/levitate';
import { EntryPointConfig, generateDtsBundle } from 'jackw-dts-bundle-gen-test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { extname, join } from 'node:path';
import { parsedArgs } from './utils.js';

export const generateTypes = () => {
  const { entryPoint, tsConfig, outDir } = parsedArgs;

  if (!entryPoint) {
    throw new Error('Please provide the path for the entry types file as an argument.');
  }

  const entryPoints: EntryPointConfig[] = [
    {
      filePath: entryPoint,
      libraries: {
        inlinedLibraries: getImportedPackages(entryPoint),
      },
    },
  ];
  const options = {
    preferredConfigPath: tsConfig,
  };
  const dts = generateDtsBundle(entryPoints, options);
  const cleanedDts = cleanDTS(dts);

  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, 'index.d.ts'), cleanedDts);
};

export function getImportedPackages(entryPoint: string) {
  const { imports } = getImportsInfo(entryPoint);
  const npmPackages = imports
    .map((importInfo) => importInfo.packageName)
    .filter((packageName) => isBareSpecifier(packageName));
  // Remove duplicates
  return Array.from(new Set(npmPackages));
}

function cleanDTS(dtsContent: string[]) {
  let dtsString = dtsContent.join('\n');
  dtsString = dtsString.replace('export {};', '');
  return dtsString.trim() + '\n';
}

function isBareSpecifier(packageName: string) {
  const isRelative = packageName.startsWith('./') || packageName.startsWith('../') || packageName.startsWith('/');
  const hasExtension = extname(packageName) !== '';
  return !isRelative && !hasExtension;
}
