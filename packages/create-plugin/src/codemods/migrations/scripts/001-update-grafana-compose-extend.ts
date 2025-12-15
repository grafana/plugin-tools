import { resolve } from 'node:path';
import { type Context } from '../../context.js';
import { Node, Pair, parseDocument, Scalar, stringify, visit, YAMLMap, Document, YAMLSeq, visitorFn } from 'yaml';

export default async function migrate(context: Context) {
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

  const buildContext = composeData.getIn(['services', 'grafana', 'build', 'context']);

  // If the build context is not the base config, exit as we assume this is not using the old config
  // for the grafana service.
  if (buildContext?.toString() !== './.config') {
    return context;
  }
  // List of key value pairs to remove from the compose file
  const keyValuePairsToRemove: string[][] = [];

  // Visit key value pairs to find those that match the base configuration
  visit(composeData, {
    Pair: ((
      _key: unknown,
      pair: Pair<unknown, unknown>,
      path: ReadonlyArray<Node | Document | Pair<unknown, unknown>>
    ) => {
      // Build up the key path to the current pair
      const keyPath: string[] = [];
      for (const p of path) {
        if (p instanceof Pair && p.key instanceof Scalar) {
          keyPath.push(p.key.value as string);
        }
      }

      if (pair.key instanceof Scalar) {
        keyPath.push(pair.key.value as string);
      }

      // We only care about the grafana service
      if (keyPath[0] === 'services' && keyPath[1] === 'grafana') {
        const baseValue = baseComposeData.getIn(keyPath);

        // If the current pair matches the base value, add it to the list of items to remove
        if (baseValue && JSON.stringify(pair.value) === JSON.stringify(baseValue)) {
          keyValuePairsToRemove.push(keyPath);
        }
      }
    }) as visitorFn<Pair<unknown, unknown>>,
  });

  // Sort the key paths by length to remove children before parents
  keyValuePairsToRemove.sort((a, b) => b.length - a.length);

  for (const keyPath of keyValuePairsToRemove) {
    composeData.deleteIn(keyPath);
  }

  visit(composeData, {
    Scalar: ((_key: unknown, node: Scalar, path: ReadonlyArray<Node | Document | Pair<unknown, unknown>>) => {
      const keyPath: string[] = [];
      for (const p of path) {
        if (p instanceof Pair && p.key instanceof Scalar) {
          keyPath.push(p.key.value as string);
        }
      }
      // Handle volumes. If both container directories are the same, resolve the host directories to check they're the same
      // and remove the volume if they are.
      if (keyPath[0] === 'services' && keyPath[1] === 'grafana' && keyPath[2] === 'volumes') {
        const baseVolumes = baseComposeData.getIn(keyPath);
        if (baseVolumes instanceof YAMLSeq && node.value) {
          const [hostDir, containerDir] = node.value.toString().split(':');
          const matchingBaseItem = baseVolumes.items.find((baseItem: unknown) => {
            if (!(baseItem instanceof Scalar)) {
              return false;
            }
            const [_, baseContainerDir] = baseItem.value.toString().split(':');
            return baseContainerDir === containerDir;
          });
          if (matchingBaseItem instanceof Scalar && node.value !== 'volumes') {
            const [baseHostDir] = matchingBaseItem.value.toString().split(':');
            const baseHostPath = resolve('./.config', baseHostDir);
            const currentHostPath = resolve('.', hostDir);
            if (baseHostPath === currentHostPath) {
              return visit.REMOVE;
            }
          }
        }
      }
      return;
    }) as visitorFn<Scalar>,
  });

  // Remove items that match the base configuration
  visit(composeData, {
    Map: ((_key: unknown, node: YAMLMap, path: ReadonlyArray<Node | Document | Pair<unknown, unknown>>) => {
      const keyPath: string[] = [];
      for (const p of path) {
        if (p instanceof Pair && p.key instanceof Scalar) {
          keyPath.push(p.key.value as string);
        }
      }

      if (keyPath[0] === 'services' && keyPath[1] === 'grafana') {
        const baseValue = baseComposeData.getIn(keyPath) as YAMLMap;
        if (baseValue && node.items) {
          // Filter out items that match the base configuration
          node.items = node.items.filter((item: Pair<unknown, unknown>) => {
            if (!(item.key instanceof Scalar)) {
              return true;
            }
            const baseItemValue = baseValue.get(item.key.value);
            return !baseItemValue || JSON.stringify(item.value) !== JSON.stringify(baseItemValue);
          });

          // If all items were filtered out, remove this map
          if (node.items.length === 0) {
            composeData.deleteIn(keyPath);
          }
        }
      }
    }) as visitorFn<YAMLMap>,
  });

  // Remove the build context
  composeData.deleteIn(['services', 'grafana', 'build', 'context']);

  // Remove the build if it has no items
  const build = composeData.getIn(['services', 'grafana', 'build']);
  if (build instanceof YAMLMap && build.items?.length === 0) {
    composeData.deleteIn(['services', 'grafana', 'build']);
  }

  // Remove the volumes if they have no items
  const volumes = composeData.getIn(['services', 'grafana', 'volumes']);
  if (volumes instanceof YAMLSeq && volumes.items.length === 0) {
    composeData.deleteIn(['services', 'grafana', 'volumes']);
  }

  // Add the extends configuration
  composeData.addIn(['services', 'grafana', 'extends'], {
    file: '.config/docker-compose-base.yaml',
    service: 'grafana',
  });

  context.updateFile('./docker-compose.yaml', stringify(composeData, { lineWidth: 120, singleQuote: true }));

  return context;
}
