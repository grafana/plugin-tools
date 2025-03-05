import chalk from 'chalk';
import minimist from 'minimist';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { CURRENT_APP_VERSION } from '../utils/utils.version.js';
import { buildManifest, saveManifest, signManifest } from '../utils/manifest.js';
import { assertRootUrlIsValid } from '../utils/pluginValidation.js';
import { getCreatePluginVersion } from '../utils/getCreatePluginVersion.js';
import { output } from '../utils/utils.output.js';

export const sign = async (argv: minimist.ParsedArgs) => {
  const distDir = argv.distDir ?? 'dist';
  const pluginDistDir = path.resolve(distDir);
  const signatureType: string = argv.signatureType;
  const rootUrls: string[] = argv.rootUrls?.split(',') ?? [];

  if (!existsSync(pluginDistDir)) {
    output.error({
      title: 'Plugin directory not found.',
      body: [
        `Directory ${chalk.bold(pluginDistDir)} not found.`,
        'Make sure to build the plugin before attempting to sign it.',
      ],
    });
    process.exitCode = 1;
    return;
  }

  try {
    output.log({
      title: 'Signing plugin.',
      body: [`Plugin directory: ${pluginDistDir}`],
    });
    const manifest = await buildManifest(pluginDistDir);

    console.log('Signing manifest...');
    if (signatureType) {
      manifest.signatureType = signatureType;
    }
    if (rootUrls && rootUrls.length > 0) {
      rootUrls.forEach(assertRootUrlIsValid);
      manifest.rootUrls = rootUrls;
    }

    manifest.signPlugin = { version: CURRENT_APP_VERSION };
    const createPluginVersion = getCreatePluginVersion();
    if (createPluginVersion) {
      manifest.createPlugin = { version: createPluginVersion };
    }

    const signedManifest = await signManifest(manifest);

    console.log('Saving signed manifest...');
    saveManifest(pluginDistDir, signedManifest);

    output.success({
      title: 'Plugin signed successfully.',
    });
  } catch (err) {
    if (err instanceof Error) {
      output.error({
        title: 'Failed to sign plugin.',
        body: [err.message],
      });
    }
    console.error(err);
    process.exitCode = 1;
  }
};
