import { resolve } from 'node:path';
import { type Context } from '../context.js';
import { parseDocument, stringify, visit } from 'yaml';

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

  const composeData = parseDocument(composeContent);
  const baseComposeData = parseDocument(baseComposeContent);

  // Check if migration is needed
  const buildContext = composeData.getIn(['services', 'grafana', 'build', 'context']);

  if (buildContext?.toString() !== './.config') {
    return context;
  }

  const composeGrafanaService = composeData.getIn(['services', 'grafana']);
  const baseGrafanaService = baseComposeData.getIn(['services', 'grafana']);

  visit(composeData, {
    Map(_key, node, path) {
      const keyPath = [];
      for (const p of path) {
        if (p.key?.value) {
          keyPath.push(p.key.value);
        }
      }

      // Only process grafana service paths
      if (keyPath[0] === 'services' && keyPath[1] === 'grafana') {
        const relativePath = keyPath.slice(2);
        const baseValue = baseGrafanaService?.getIn(relativePath);

        if (baseValue && node.items) {
          // Filter out items that match the base configuration
          node.items = node.items.filter((item) => {
            const baseItemValue = baseValue.get(item.key.value);
            return !baseItemValue || JSON.stringify(item.value) !== JSON.stringify(baseItemValue);
          });

          // If all items were filtered out, remove this map
          if (node.items.length === 0) {
            composeData.deleteIn(keyPath);
          }
        }
      }
    },
  });

  visit(composeData, {
    Scalar(_key, node, path) {
      const keyPath = [];
      for (const p of path) {
        if (p.key?.value) {
          keyPath.push(p.key.value);
        }
      }

      if (keyPath[0] === 'services' && keyPath[1] === 'grafana' && keyPath[2] === 'volumes') {
        const relativePath = keyPath.slice(2);

        const baseVolumes = baseGrafanaService.getIn(relativePath);
        if (baseVolumes?.items && node.value) {
          const [hostDir, containerDir] = node.value.split(':');
          const matchingBaseItem = baseVolumes.items.find((baseItem) => {
            const [_, baseContainerDir] = baseItem.value.split(':');
            return baseContainerDir === containerDir;
          });

          if (matchingBaseItem) {
            const [baseHostDir, _] = matchingBaseItem.value.split(':');
            const baseHostPath = resolve('./config', baseHostDir);
            const currentHostPath = resolve('.', hostDir);
            if (baseHostPath === currentHostPath) {
              composeData.deleteIn(keyPath);
            }
          }
        }
      }
    },
  });

  visit(composeData, {
    Pair(_key, pair, path) {
      const keyPath = [];
      for (const p of path) {
        if (p.key?.value) {
          keyPath.push(p.key.value);
        }
      }
      keyPath.push(pair.key.value);

      // Only process grafana service paths
      if (keyPath[0] === 'services' && keyPath[1] === 'grafana') {
        const relativePath = keyPath.slice(2);
        const baseValue = baseGrafanaService?.getIn(relativePath);

        // If this pair's value matches the base value, remove it
        if (baseValue && JSON.stringify(pair.value) === JSON.stringify(baseValue)) {
          composeData.deleteIn(keyPath);
        }
      }
    },
  });

  composeGrafanaService.deleteIn(['build', 'context']);
  composeGrafanaService.addIn(['extends'], {
    file: '.config/docker-compose-base.yaml',
    service: 'grafana',
  });

  // Write the updated compose file
  context.updateFile('./docker-compose.yaml', stringify(composeData, { lineWidth: 120, singleQuote: true }));

  return context;
}
