import { isMap, isScalar, Pair, parseDocument, Scalar } from 'yaml';
import type { Context } from '../../context.js';
import { migrationsDebug } from '../../utils.js';

const DOCKERFILE_PATH = '.config/Dockerfile';
const COMPOSE_PATH = '.config/docker-compose-base.yaml';
const README_PATH = '.config/README.md';
const OLD_FROM = 'FROM grafana/${grafana_image}:${grafana_version}';
const NEW_FROM = 'FROM ${grafana_repository:-grafana/${grafana_image}}:${grafana_version}';
const GRAFANA_IMAGE_ARG = /^(ARG grafana_image=[^\r\n]*)(\r?\n)/m;
const README_ANCHOR =
  'In this example, we assign the environment variable `GRAFANA_IMAGE` to the build arg `grafana_image` with a default value of `grafana`. This will allow you to set the value while running the docker compose commands, which might be convenient in some scenarios.';
const README_NOTE = `${README_ANCHOR}\n\nTo use a different registry or repository, set \`GRAFANA_REPOSITORY\` to the full repository path without a tag:\n\n\`\`\`shell\nGRAFANA_REPOSITORY=registry.example.com/team/grafana GRAFANA_VERSION=13.2.4 docker compose up --build\n\`\`\`\n\n\`GRAFANA_REPOSITORY\` replaces the entire \`grafana/\${GRAFANA_IMAGE}\` path. \`GRAFANA_VERSION\` still sets the tag. If \`GRAFANA_REPOSITORY\` is unset or empty, the image remains \`grafana/\${GRAFANA_IMAGE}\`.`;

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

  if (context.doesFileExist(README_PATH)) {
    const readme = context.getFile(README_PATH);
    if (readme?.includes(README_ANCHOR) && !readme.includes('GRAFANA_REPOSITORY')) {
      context.updateFile(README_PATH, readme.replace(README_ANCHOR, README_NOTE));
    } else {
      migrationsDebug(
        `${README_PATH} has no Grafana image configuration section or already documents the override, skipping`
      );
    }
  }

  return context;
}
