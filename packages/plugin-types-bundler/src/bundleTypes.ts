import { getImportsInfo } from '@grafana/levitate';
import { EntryPointConfig, generateDtsBundle } from 'jackw-dts-bundle-gen-test';
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { extname, join } from 'node:path';
import { DEFAULT_ARGS, type ParsedArgs } from './args.js';
import { debug } from './debug.js';

export const generateTypes = (args: ParsedArgs) => {
  const { entryPoint, tsConfig, outDir } = handleArgs(args);
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

  debug({ ...entryPoints[0], ...options });

  const dts = generateDtsBundle(entryPoints, options);
  const cleanedDts = cleanDTS(dts);

  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, 'index.d.ts'), cleanedDts);
};

function getImportedPackages(entryPoint: string) {
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

function handleArgs(args: ParsedArgs) {
  let { entryPoint, tsConfig, outDir } = args;

  if (entryPoint === undefined) {
    throw new Error(
      'Please provide the path for the entry types file as an argument. (E.g. "npx @grafana/plugin-types-bundler --entry-point ./src/types/index.ts")'
    );
  }

  if (!existsSync(entryPoint)) {
    throw new Error(`Entry point not found: ${entryPoint}`);
  }

  if (!Boolean(tsConfig)) {
    debug("No tsconfig provided, using default tsconfig.json ('../tsconfig/tsconfig.json')");
    tsConfig = DEFAULT_ARGS.tsConfig;
  }

  if (!Boolean(outDir)) {
    debug("No outDir provided, using default dist ('./dist')");
    outDir = DEFAULT_ARGS.outDir;
  }

  return { entryPoint, tsConfig, outDir };
}
