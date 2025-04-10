import { type Context } from '../context.js';
import { parse, stringify } from 'yaml';

export default async function migrate(context: Context) {
  // Check if necessary files exist
  if (!context.doesFileExist('./docker-compose.yaml') || !context.doesFileExist('./.config/docker-compose-base.yaml')) {
    return context;
  }

  const composeContent = context.getFile('./docker-compose.yaml');
  const baseComposeContent = context.getFile('./.config/docker-compose-base.yaml');

  if (!composeContent || !baseComposeContent) {
    return context;
  }

  const composeData = parse(composeContent);

  if (composeData?.services?.grafana?.build?.context !== './.config') {
    return context;
  }

  const baseComposeData = parse(baseComposeContent);
  const baseEnv = baseComposeData?.services?.grafana?.environment || {};

  // Preserve build args if they exist
  const existingBuildArgs = composeData.services.grafana.build.args;
  const preservedArgs: Record<string, string> = {};
  for (const arg of ['grafana_image', 'grafana_version']) {
    if (existingBuildArgs?.[arg]) {
      preservedArgs[arg] = existingBuildArgs[arg];
    }
  }

  // Preserve environment variables that don't exist in base
  let existingEnv = composeData.services.grafana.environment || {};
  if (Array.isArray(existingEnv)) {
    existingEnv = existingEnv.reduce((acc, curr) => {
      const [key, value] = curr.split('=');
      acc[key] = value;
      return acc;
    }, {});
  }

  const preservedEnv: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(existingEnv)) {
    const baseEnvHasKey = Object.keys(baseEnv).includes(key);
    if (!baseEnvHasKey) {
      preservedEnv[key] = value;
    }
  }

  // Update the grafana service configuration
  composeData.services.grafana = {
    extends: {
      file: '.config/docker-compose-base.yaml',
      service: 'grafana',
    },
    ...(Object.keys(preservedArgs).length > 0 && {
      build: {
        args: preservedArgs,
      },
    }),
    ...(Object.keys(preservedEnv).length > 0 && {
      environment: preservedEnv,
    }),
  };

  // Write the updated compose file
  context.updateFile('./docker-compose.yaml', stringify(composeData, { lineWidth: 0, singleQuote: true }));

  return context;
}
