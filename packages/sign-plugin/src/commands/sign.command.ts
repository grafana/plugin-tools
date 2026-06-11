import { styleText } from 'node:util';
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
        `Directory ${styleText(['bold'], pluginDistDir)} not found.`,
        'Make sure to build the plugin before attempting to sign it.',
      ],
    });
    process.exit(1);
  }

  const token = getSigningToken();

  try {
    output.log({
      title: 'Signing plugin.',
      body: [`Plugin found in ${pluginDistDir}`],
    });
    const manifest = await buildManifest(pluginDistDir);

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

    const signedManifest = await signManifest(manifest, token);

    saveManifest(pluginDistDir, signedManifest);
    output.success({
      title: `Plugin signed successsfully.`,
      body: [`Signed manifest saved to ${pluginDistDir}.`],
    });
  } catch (err) {
    if (err instanceof Error) {
      output.error({
        title: 'Failed to sign plugin.',
        body: [err.message],
      });
    }
    process.exit(1);
  }
};

function getSigningToken(): string {
  const GRAFANA_API_KEY = process.env.GRAFANA_API_KEY;
  const GRAFANA_ACCESS_POLICY_TOKEN = process.env.GRAFANA_ACCESS_POLICY_TOKEN;
  const token = GRAFANA_ACCESS_POLICY_TOKEN ? GRAFANA_ACCESS_POLICY_TOKEN : GRAFANA_API_KEY;

  if (!token) {
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

  return token;
}
