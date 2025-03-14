import { type Context } from '../context.js';
import { parse, stringify } from 'yaml';

export default async function migrate(context: Context) {
  // Check if docker-compose.yaml exists
  if (!context.doesFileExist('./docker-compose.yaml')) {
    return context;
  }

  // Read and parse the docker-compose file
  const composeContent = context.getFile('./docker-compose.yaml');
  if (!composeContent) {
    return context;
  }

  const composeData = parse(composeContent);

  // Check if grafana service exists with the specified build context
  if (composeData?.services?.grafana?.build?.context !== './.config') {
    return context;
  }

  // Check if base compose file exists
  if (!context.doesFileExist('./.config/docker-compose-base.yaml')) {
    return context;
  }

  // Preserve build args if they exist
  const existingBuildArgs = composeData.services.grafana.build.args;
  const preservedArgs: Record<string, string> = {};
  if (existingBuildArgs?.grafana_image || existingBuildArgs?.grafana_version) {
    if (existingBuildArgs.grafana_image) {
      preservedArgs['grafana_image'] = existingBuildArgs.grafana_image;
    }
    if (existingBuildArgs.grafana_version) {
      preservedArgs['grafana_version'] = existingBuildArgs.grafana_version;
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
  };

  // Write the updated compose file
  context.updateFile('./docker-compose.yaml', stringify(composeData, { lineWidth: 0 }));

  return context;
}
