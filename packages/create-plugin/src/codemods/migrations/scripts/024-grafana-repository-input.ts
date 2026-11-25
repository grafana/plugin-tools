import { isMap, isScalar, Pair, parseDocument, Scalar } from 'yaml';
import type { Context } from '../../context.js';
import { migrationsDebug } from '../../utils.js';

const DOCKERFILE_PATH = '.config/Dockerfile';
const COMPOSE_PATH = '.config/docker-compose-base.yaml';
const OLD_FROM = 'FROM grafana/${grafana_image}:${grafana_version}';
const NEW_FROM = 'FROM ${grafana_repository:-grafana/${grafana_image}}:${grafana_version}';
const GRAFANA_IMAGE_ARG = /^(ARG grafana_image=[^\r\n]*)(\r?\n)/m;

export default function migrate(context: Context): Context {
  if (context.doesFileExist(DOCKERFILE_PATH)) {
    const content = context.getFile(DOCKERFILE_PATH);
    if (content?.includes(OLD_FROM) && !content.includes('grafana_repository') && GRAFANA_IMAGE_ARG.test(content)) {
      const updatedContent = content
        .replace(OLD_FROM, NEW_FROM)
        .replace(GRAFANA_IMAGE_ARG, '$1$2ARG grafana_repository$2');
      context.updateFile(DOCKERFILE_PATH, updatedContent);
    } else {
      migrationsDebug(`${DOCKERFILE_PATH} already supports a repository override or uses a custom image, skipping`);
    }
  }

  if (!context.doesFileExist(COMPOSE_PATH)) {
    migrationsDebug(`${COMPOSE_PATH} not found, skipping`);
  } else {
    const content = context.getFile(COMPOSE_PATH);
    if (content !== undefined) {
      const document = parseDocument(content);
      if (document.errors.length > 0) {
        migrationsDebug(`Failed to parse ${COMPOSE_PATH}: ${document.errors[0].message}, skipping`);
      } else {
        const args = document.getIn(['services', 'grafana', 'build', 'args']);
        if (isMap(args) && !args.has('grafana_repository')) {
          const grafanaImagePairIndex = args.items.findIndex(
            (pair) => isScalar(pair.key) && pair.key.value === 'grafana_image'
          );
          const repositoryPair = new Pair(new Scalar('grafana_repository'), new Scalar('${GRAFANA_REPOSITORY:-}'));
          const repositoryIndex = grafanaImagePairIndex >= 0 ? grafanaImagePairIndex + 1 : args.items.length;
          args.items.splice(repositoryIndex, 0, repositoryPair);
          context.updateFile(COMPOSE_PATH, document.toString({ lineWidth: 120 }));
        } else {
          migrationsDebug(`${COMPOSE_PATH} has no build args map or already sets grafana_repository, skipping`);
        }
      }
    }
  }

  return context;
}
