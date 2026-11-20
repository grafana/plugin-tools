import { isScalar, parseDocument } from 'yaml';
import type { Context } from '../../context.js';
import { migrationsDebug } from '../../utils.js';
import { bumpActionRefs } from '../../utils.workflows.js';
import { output } from '../../../utils/utils.console.js';

const DOCKERFILE_PATH = '.config/Dockerfile';
const BASE_COMPOSE_PATH = '.config/docker-compose-base.yaml';
const ROOT_COMPOSE_PATH = 'docker-compose.yaml';
const README_PATH = '.config/README.md';
const WORKFLOWS_DIR = '.github/workflows';
const E2E_VERSION_ACTION = 'grafana/plugin-actions/e2e-version';
const E2E_VERSION_MINIMUM = 'e2e-version/v4.0.1';
const IMAGE_ARG_PATH = ['services', 'grafana', 'build', 'args', 'grafana_image'];
const OLD_COMPOSE_IMAGE = '${GRAFANA_IMAGE:-grafana-enterprise}';
const NEW_COMPOSE_IMAGE = '${GRAFANA_IMAGE:-grafana}';
const DOCKERFILE_IMAGE_ARG = /^ARG grafana_image=(.*)$/m;

const OLD_README_SECTION = `By default, \`grafana-enterprise\` will be used as the docker image for all docker related commands. If you want to override this behavior, simply alter the \`docker-compose.yaml\` by adding the following build arg \`grafana_image\`.

**Example:**

\`\`\`yaml
version: '3.7'

services:
  grafana:
    extends:
      file: .config/docker-compose-base.yaml
      service: grafana
    build:
      args:
        grafana_version: \${GRAFANA_VERSION:-9.1.2}
        grafana_image: \${GRAFANA_IMAGE:-grafana}
\`\`\`

In this example, we assign the environment variable \`GRAFANA_IMAGE\` to the build arg \`grafana_image\` with a default value of \`grafana\`.`;
const NEW_README_SECTION = OLD_README_SECTION.replace('By default, `grafana-enterprise`', 'By default, `grafana`')
  .replace('grafana_image: ${GRAFANA_IMAGE:-grafana}', 'grafana_image: ${GRAFANA_IMAGE:-grafana-enterprise}')
  .replace('with a default value of `grafana`.', 'with a default value of `grafana-enterprise`.');

export default function migrate(context: Context): Context {
  const customised = [migrateDockerfile(context), migrateBaseCompose(context)].filter(
    (path): path is string => path !== undefined
  );
  migrateReadme(context);
  const unpinnable = migrateWorkflows(context);

  if (customised.length > 0) {
    output.warning({
      title: 'The default Grafana image was not changed in some files',
      body: [
        `${customised.join(' and ')} set a custom Grafana image, so they were left as they are.`,
        'New plugins default to the Grafana OSS image (`grafana`). Update these files by hand if you want the same.',
      ],
    });
  }

  if (unpinnable.length > 0) {
    output.warning({
      title: `${E2E_VERSION_ACTION} could not be updated`,
      body: [
        `${unpinnable.join(' and ')} pin ${E2E_VERSION_ACTION} to a branch or commit SHA.`,
        `Update it to ${E2E_VERSION_MINIMUM} or later by hand so e2e tests run against the Grafana OSS image.`,
      ],
    });
  }

  if (rootComposeUsesEnterprise(context)) {
    output.warning({
      title: `${ROOT_COMPOSE_PATH} uses the grafana-enterprise image`,
      body: [
        `Local development keeps using Grafana Enterprise, but ${E2E_VERSION_ACTION} v4 resolves the Grafana OSS image by default.`,
        `If your e2e tests need Enterprise features, add \`grafana-image: grafana-enterprise\` to the ${E2E_VERSION_ACTION} step in your workflow.`,
      ],
    });
  }

  return context;
}

// returns the path when the file sets a custom image
function migrateDockerfile(context: Context): string | undefined {
  if (!context.doesFileExist(DOCKERFILE_PATH)) {
    migrationsDebug(`${DOCKERFILE_PATH} not found, skipping`);
    return undefined;
  }
  const content = context.getFile(DOCKERFILE_PATH) ?? '';
  const image = DOCKERFILE_IMAGE_ARG.exec(content)?.[1];
  if (image === undefined) {
    migrationsDebug(`${DOCKERFILE_PATH} has no grafana_image build arg, skipping`);
    return undefined;
  }
  if (image === 'grafana') {
    migrationsDebug(`${DOCKERFILE_PATH} already defaults to the grafana image, skipping`);
    return undefined;
  }
  if (image !== 'grafana-enterprise') {
    migrationsDebug(`${DOCKERFILE_PATH} defaults to a custom image '${image}', skipping`);
    return DOCKERFILE_PATH;
  }
  context.updateFile(DOCKERFILE_PATH, content.replace(DOCKERFILE_IMAGE_ARG, 'ARG grafana_image=grafana'));
  return undefined;
}

// returns the path when the file sets a custom image
function migrateBaseCompose(context: Context): string | undefined {
  if (!context.doesFileExist(BASE_COMPOSE_PATH)) {
    migrationsDebug(`${BASE_COMPOSE_PATH} not found, skipping`);
    return undefined;
  }
  const document = parseDocument(context.getFile(BASE_COMPOSE_PATH) ?? '');
  if (document.errors.length > 0) {
    migrationsDebug(`Failed to parse ${BASE_COMPOSE_PATH}: ${document.errors[0].message}, skipping`);
    return undefined;
  }
  const image = document.getIn(IMAGE_ARG_PATH, true);
  if (!isScalar(image)) {
    migrationsDebug(`${BASE_COMPOSE_PATH} has no grafana_image build arg, skipping`);
    return undefined;
  }
  if (image.value === NEW_COMPOSE_IMAGE) {
    migrationsDebug(`${BASE_COMPOSE_PATH} already defaults to the grafana image, skipping`);
    return undefined;
  }
  if (image.value !== OLD_COMPOSE_IMAGE) {
    migrationsDebug(`${BASE_COMPOSE_PATH} sets a custom grafana_image '${String(image.value)}', skipping`);
    return BASE_COMPOSE_PATH;
  }
  // set the value on the node so comments on the line are kept
  image.value = NEW_COMPOSE_IMAGE;
  context.updateFile(BASE_COMPOSE_PATH, document.toString({ lineWidth: 120 }));
  return undefined;
}

function migrateReadme(context: Context) {
  if (!context.doesFileExist(README_PATH)) {
    migrationsDebug(`${README_PATH} not found, skipping`);
    return;
  }
  const content = context.getFile(README_PATH) ?? '';
  if (!content.includes(OLD_README_SECTION)) {
    migrationsDebug(`${README_PATH} has no default Grafana image section to update, skipping`);
    return;
  }
  context.updateFile(README_PATH, content.replace(OLD_README_SECTION, NEW_README_SECTION));
}

// returns the workflows that pin e2e-version to a ref bumpActionRefs can't raise
function migrateWorkflows(context: Context): string[] {
  const workflows = context.readDir(WORKFLOWS_DIR).filter((path) => /\.ya?ml$/.test(path));
  if (workflows.length === 0) {
    migrationsDebug(`No workflows found in ${WORKFLOWS_DIR}, skipping`);
    return [];
  }
  return workflows.filter((path) => {
    const { unrecognized } = bumpActionRefs(context, path, { [E2E_VERSION_ACTION]: E2E_VERSION_MINIMUM });
    return unrecognized.length > 0;
  });
}

function rootComposeUsesEnterprise(context: Context): boolean {
  if (!context.doesFileExist(ROOT_COMPOSE_PATH)) {
    return false;
  }
  const document = parseDocument(context.getFile(ROOT_COMPOSE_PATH) ?? '');
  if (document.errors.length > 0) {
    migrationsDebug(`Failed to parse ${ROOT_COMPOSE_PATH}: ${document.errors[0].message}, skipping image check`);
    return false;
  }
  const image = document.getIn(IMAGE_ARG_PATH);
  return typeof image === 'string' && image.includes('grafana-enterprise');
}
