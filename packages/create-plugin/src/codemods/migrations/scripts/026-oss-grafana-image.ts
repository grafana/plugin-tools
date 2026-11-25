import { isScalar, parseDocument } from 'yaml';
import type { Context } from '../../context.js';
import { migrationsDebug } from '../../utils.js';
import { bumpActionRefs } from '../../utils.workflows.js';
import { output } from '../../../utils/utils.console.js';

const DOCKERFILE_PATH = '.config/Dockerfile';
const BASE_COMPOSE_PATH = '.config/docker-compose-base.yaml';
const ROOT_COMPOSE_PATH = 'docker-compose.yaml';
const WORKFLOWS_DIR = '.github/workflows';
const E2E_VERSION_ACTION = 'grafana/plugin-actions/e2e-version';
const E2E_VERSION_MINIMUM = 'e2e-version/v4.0.1';
const IMAGE_ARG_PATH = ['services', 'grafana', 'build', 'args', 'grafana_image'];
const OLD_COMPOSE_IMAGE = '${GRAFANA_IMAGE:-grafana-enterprise}';
const NEW_COMPOSE_IMAGE = '${GRAFANA_IMAGE:-grafana}';
const DOCKERFILE_IMAGE_ARG = /^ARG grafana_image=(.*)$/m;

interface CustomImage {
  path: string;
  image: string;
}

export default function migrate(context: Context): Context {
  const customised = [migrateDockerfile(context), migrateBaseCompose(context)].filter(
    (custom): custom is CustomImage => custom !== undefined
  );
  const unpinnable = migrateWorkflows(context);

  if (customised.length > 0) {
    output.warning({
      title: 'The default Grafana image was not changed in some files',
      body: [
        `${joinPaths(customised.map(({ path }) => path))} ${customised.length === 1 ? 'sets' : 'set'} a custom Grafana image, so ${customised.length === 1 ? 'it was' : 'they were'} left as is.`,
        'New plugins default to the Grafana OSS image (`grafana`). Update these files by hand if you want the same.',
      ],
    });
  }

  if (unpinnable.length > 0) {
    output.warning({
      title: `${E2E_VERSION_ACTION} could not be updated`,
      body: [
        `${joinPaths(unpinnable)} ${unpinnable.length === 1 ? 'pins' : 'pin'} ${E2E_VERSION_ACTION} to a branch or commit SHA.`,
        `Update it to ${E2E_VERSION_MINIMUM} or later by hand so e2e tests run against the Grafana OSS image.`,
      ],
    });
  }

  const enterprise = [
    ...customised.filter(({ image }) => image.includes('grafana-enterprise')).map(({ path }) => path),
    ...(rootComposeUsesEnterprise(context) ? [ROOT_COMPOSE_PATH] : []),
  ];
  if (enterprise.length > 0) {
    output.warning({
      title: `${joinPaths(enterprise)} ${enterprise.length === 1 ? 'uses' : 'use'} the grafana-enterprise image`,
      body: [
        `Local development keeps using Grafana Enterprise, but ${E2E_VERSION_ACTION} v4 resolves the Grafana OSS image by default.`,
        `If your e2e tests need Enterprise features, add \`grafana-image: grafana-enterprise\` to the ${E2E_VERSION_ACTION} step in your workflow.`,
      ],
    });
  }

  return context;
}

function joinPaths(paths: string[]): string {
  return paths.length <= 1 ? paths.join('') : `${paths.slice(0, -1).join(', ')} and ${paths.at(-1)}`;
}

function migrateDockerfile(context: Context): CustomImage | undefined {
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
    return { path: DOCKERFILE_PATH, image };
  }
  context.updateFile(DOCKERFILE_PATH, content.replace(DOCKERFILE_IMAGE_ARG, 'ARG grafana_image=grafana'));
  return undefined;
}

function migrateBaseCompose(context: Context): CustomImage | undefined {
  if (!context.doesFileExist(BASE_COMPOSE_PATH)) {
    migrationsDebug(`${BASE_COMPOSE_PATH} not found, skipping`);
    return undefined;
  }
  const content = context.getFile(BASE_COMPOSE_PATH) ?? '';
  const document = parseDocument(content);
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
    return { path: BASE_COMPOSE_PATH, image: String(image.value) };
  }
  if (!image.range) {
    migrationsDebug(`${BASE_COMPOSE_PATH} grafana_image has no source range, skipping`);
    return undefined;
  }
  // replace only the value's source text so the rest of the file keeps its formatting
  const [start, end] = image.range;
  const value = content.slice(start, end).replace(OLD_COMPOSE_IMAGE, NEW_COMPOSE_IMAGE);
  context.updateFile(BASE_COMPOSE_PATH, `${content.slice(0, start)}${value}${content.slice(end)}`);
  return undefined;
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
