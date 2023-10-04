import path from 'path';
import minimist from 'minimist';
import { existsSync } from 'fs';
import { assertRootUrlIsValid } from '../utils/pluginValidation';
import { buildManifest, signManifest, saveManifest } from '../utils/manifest';
import { getVersion } from '../utils/getVersion';
import { bundle } from './bundle.command';

export const sign = async (argv: minimist.ParsedArgs) => {
  const distDir = argv.distDir ?? 'dist';
  const pluginDistDir = path.resolve(distDir);
  const signatureType: string = argv.signatureType;
  const rootUrls: string[] = argv.rootUrls?.split(',') ?? [];
  const bundleDist: boolean = argv.bundle ?? false;
  
  if (!existsSync(pluginDistDir)) {
    throw new Error(`Plugin \`${distDir}\` directory is missing. Did you build the plugin before attempting to sign?`);
  }

  try {
    console.log('Building manifest...');
    const manifest = await buildManifest(pluginDistDir);

    console.log('Signing manifest...');
    if (signatureType) {
      manifest.signatureType = signatureType;
    }
    if (rootUrls && rootUrls.length > 0) {
      rootUrls.forEach(assertRootUrlIsValid);
      manifest.rootUrls = rootUrls;
    }

    manifest.signPlugin = { version: getVersion() };
    const signedManifest = await signManifest(manifest);

    console.log('Saving signed manifest...');
    saveManifest(pluginDistDir, signedManifest);

    console.log('Signed successfully');

    if (bundleDist) {
      bundle(pluginDistDir);
    }
  } catch (err) {
    console.warn(err);
    process.exitCode = 1;
  }
};
