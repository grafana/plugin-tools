import * as v from 'valibot';
import { parseDocument, stringify, YAMLMap, Scalar, type Document, type Node } from 'yaml';
import type { Context, ContextMessage } from '../../context.js';
import { output } from '../../../utils/utils.console.js';
import { getPackageManagerFromUserAgent } from '../../../utils/utils.packageManager.js';
import { addDependenciesToPackageJson, additionsDebug } from '../../utils.js';

// plugin-vcr isn't on npm yet, so this points at a pkg.pr.new preview build
export const PLUGIN_VCR_PACKAGE = 'https://pkg.pr.new/grafana/plugin-tools/@grafana/plugin-vcr@f191a32';

const COMPOSE_FILE = 'docker-compose.vcr.yaml';
const CONFIG_FILE = 'e2e/recordings/vcr.json';
const GITIGNORE_FILE = 'e2e/recordings/.gitignore';
const DOCS_URL = 'https://github.com/grafana/plugin-tools/tree/main/packages/plugin-vcr';

export const schema = v.object({
  hosts: v.optional(
    v.pipe(
      v.union([v.string(), v.array(v.string())]),
      v.transform((value) =>
        (Array.isArray(value) ? value : value.split(',')).map((host) => host.trim()).filter(Boolean)
      )
    )
  ),
  vcrPackage: v.optional(v.string(), PLUGIN_VCR_PACKAGE),
});

type VcrOptions = v.InferOutput<typeof schema>;

interface VcrConfig {
  preset?: 'aws';
  hosts: string[];
}

type Vendor = 'aws' | 'google' | 'unknown';

/**
 * Adds plugin-vcr record and replay of the third-party API traffic a backend plugin makes.
 *
 * Every step skips files and keys that already exist, so re-running is a no-op.
 */
export default function vcr(context: Context, options: VcrOptions = { vcrPackage: PLUGIN_VCR_PACKAGE }): Context {
  if (!isBackendPlugin(context) || !hasGrafanaService(context)) {
    return context;
  }

  const changesBefore = Object.keys(context.listChanges()).length;
  const vendor = detectVendor(context);
  const secretEnvVars = findSecretEnvVars(context);

  const vendorConfig = configForVendor(vendor);
  addConfig(context, options.hosts ? { ...vendorConfig, hosts: options.hosts } : vendorConfig);
  addGitignore(context);
  addComposeFile(context, options.vcrPackage, secretEnvVars);
  addScripts(context);
  addDevDependency(context, options.vcrPackage);
  const isCiWired = wireCiWorkflows(context);

  if (Object.keys(context.listChanges()).length > changesBefore) {
    context.setMessage(
      buildNextStepsMessage({
        vendor,
        isCiWired,
        hasHosts: Boolean(options.hosts?.length) || vendor !== 'unknown',
        extraServices: findExtraServices(context),
        secretEnvVars,
      })
    );
  }

  return context;
}

function skip(title: string, body: string[] = []) {
  output.warning({ title: `Skipping vcr: ${title}`, body });
}

function isBackendPlugin(context: Context): boolean {
  const pluginJsonContent = context.getFile('src/plugin.json');

  if (!pluginJsonContent) {
    skip('Could not find src/plugin.json.', ['Run this from the root of your plugin.']);
    return false;
  }

  let pluginJson;
  try {
    pluginJson = JSON.parse(pluginJsonContent);
  } catch (error) {
    additionsDebug(`Failed to parse src/plugin.json: ${error}`);
    skip('Could not parse src/plugin.json.');
    return false;
  }

  if (pluginJson.backend !== true) {
    skip('this plugin has no backend.', [
      'plugin-vcr records the calls a plugin backend makes. Mock calls made by the browser in Playwright instead.',
    ]);
    return false;
  }

  return true;
}

function hasGrafanaService(context: Context): boolean {
  const content = context.getFile('docker-compose.yaml');

  if (!content || !(parseDocument(content).getIn(['services', 'grafana']) instanceof YAMLMap)) {
    skip('Could not find a grafana service in docker-compose.yaml.', [
      `${COMPOSE_FILE} extends that service, so it must exist first.`,
    ]);
    return false;
  }

  return true;
}

function detectVendor(context: Context): Vendor {
  const goMod = context.getFile('go.mod') ?? '';

  if (/github\.com\/(aws\/aws-sdk-go|grafana\/grafana-aws-sdk)/.test(goMod)) {
    return 'aws';
  }

  if (/github\.com\/grafana\/grafana-google-sdk-go|cloud\.google\.com\/go|golang\.org\/x\/oauth2\/google/.test(goMod)) {
    return 'google';
  }

  return 'unknown';
}

function configForVendor(vendor: Vendor): VcrConfig {
  switch (vendor) {
    case 'aws':
      return { preset: 'aws', hosts: ['*.amazonaws.com'] };
    case 'google':
      return { hosts: ['*.googleapis.com'] };
    default:
      return { hosts: [] };
  }
}

interface SecretEnvVar {
  name: string;
  hasUnsupportedDefault: boolean;
}

// Grafana expands $VAR and ${VAR} with os.ExpandEnv, which reads ${VAR:-x} as a variable named "VAR:-x"
const ENV_REF_REGEX = /\$(?:\{([A-Za-z_][A-Za-z0-9_]*)(:?-[^}]*)?\}|([A-Za-z_][A-Za-z0-9_]*))/g;

/** Environment variables referenced under secureJsonData in the provisioned datasources. */
function findSecretEnvVars(context: Context): SecretEnvVar[] {
  const found = new Map<string, SecretEnvVar>();
  const files = context.readDir('provisioning/datasources').filter((file) => /\.ya?ml$/.test(file));

  for (const file of files) {
    let datasources: unknown;
    try {
      datasources = parseDocument(context.getFile(file) ?? '').toJS()?.datasources;
    } catch (error) {
      additionsDebug(`Failed to parse ${file}: ${error}`);
      continue;
    }

    if (!Array.isArray(datasources)) {
      continue;
    }

    for (const datasource of datasources) {
      for (const value of Object.values(datasource?.secureJsonData ?? {})) {
        for (const match of String(value).matchAll(ENV_REF_REGEX)) {
          const name = match[1] ?? match[3];
          const existing = found.get(name);
          found.set(name, {
            name,
            hasUnsupportedDefault: Boolean(match[2]) || Boolean(existing?.hasUnsupportedDefault),
          });
        }
      }
    }
  }

  return [...found.values()].sort((a, b) => a.name.localeCompare(b.name));
}

function addConfig(context: Context, config: VcrConfig) {
  if (context.doesFileExist(CONFIG_FILE)) {
    additionsDebug(`${CONFIG_FILE} already exists. Skipping.`);
    return;
  }

  context.addFile(CONFIG_FILE, `${JSON.stringify(config, null, 2)}\n`);
}

function addGitignore(context: Context) {
  if (context.doesFileExist(GITIGNORE_FILE)) {
    additionsDebug(`${GITIGNORE_FILE} already exists. Skipping.`);
    return;
  }

  context.addFile(
    GITIGNORE_FILE,
    `# the CA's private key never leaves this machine
.ca/
# recordings the pre-write scan refused, kept only for inspection
*.quarantine.json
# a write interrupted by a kill
*.tmp
`
  );
}

function composeTemplate(vcrPackage: string): string {
  return `# Runs Grafana behind plugin-vcr, which records or replays the plugin's third-party API calls.
# Set VCR_MODE=record to record. The default replays with no network and no credentials.
# Docs: ${DOCS_URL}
services:
  vcr:
    image: node:24-alpine
    entrypoint: [npx, -y, '${vcrPackage}']
    command:
      - serve
      - --mode
      - \${VCR_MODE:-replay}
      - --har
      - /recordings/api.har
      - --ca-dir
      - /recordings/.ca
      - --config
      - /recordings/vcr.json
      - --provisioning
      - /provisioning
      - --port
      - '8091'
    environment: {}
    volumes:
      - ./e2e/recordings:/recordings
      - ./provisioning:/provisioning:ro
      - vcr-npm-cache:/root/.npm
    healthcheck:
      test: ['CMD', 'wget', '-qO', '/dev/null', 'http://localhost:8091/ca.pem']
      interval: 1s
      timeout: 3s
      retries: 30
      # the first start downloads plugin-vcr
      start_period: 120s

  grafana:
    extends:
      file: docker-compose.yaml
      service: grafana
    depends_on:
      vcr:
        condition: service_healthy
    entrypoint:
      - /bin/sh
      - -c
      - |
        # go reads every file in /etc/ssl/certs; older Grafana doesn't forward SSL_CERT_DIR to plugins
        curl -sf http://vcr:8091/ca.pem -o /etc/ssl/certs/plugin-vcr-ca.pem
        if [ -x /entrypoint.sh ]; then exec /entrypoint.sh; fi
        exec /run.sh
    environment:
      HTTPS_PROXY: http://vcr:8091
      HTTP_PROXY: http://vcr:8091
      NO_PROXY: localhost,127.0.0.1

volumes:
  vcr-npm-cache:
`;
}

function addComposeFile(context: Context, vcrPackage: string, secretEnvVars: SecretEnvVar[]) {
  if (context.doesFileExist(COMPOSE_FILE)) {
    additionsDebug(`${COMPOSE_FILE} already exists. Skipping.`);
    return;
  }

  const doc = parseDocument(composeTemplate(vcrPackage));

  // the proxy reads these through provisioning to know what to scrub, and the dummy default lets replay start
  for (const { name } of secretEnvVars) {
    doc.setIn(['services', 'vcr', 'environment', name], `\${${name}:-dummy}`);
    doc.setIn(['services', 'grafana', 'environment', name], `\${${name}:-dummy}`);
  }

  if (secretEnvVars.length === 0) {
    doc.deleteIn(['services', 'vcr', 'environment']);
  }

  context.addFile(COMPOSE_FILE, stringifyYaml(doc));
}

function addScripts(context: Context) {
  const raw = context.getFile('package.json');

  if (!raw) {
    additionsDebug('Could not find package.json. Skipping the server:record and server:replay scripts.');
    return;
  }

  let packageJson;
  try {
    packageJson = JSON.parse(raw);
  } catch (error) {
    additionsDebug(`Failed to parse package.json: ${error}`);
    return;
  }

  const scripts: Record<string, string> = { ...packageJson.scripts };

  for (const mode of ['record', 'replay']) {
    const name = `server:${mode}`;
    if (scripts[name]) {
      additionsDebug(`A ${name} script already exists. Skipping.`);
      continue;
    }
    scripts[name] = `VCR_MODE=${mode} docker compose -f ${COMPOSE_FILE} up --build --force-recreate`;
  }

  packageJson.scripts = scripts;
  context.updateFile('package.json', JSON.stringify(packageJson, null, 2));
}

/** Lets `npx plugin-vcr fields` and the other commands run locally, at the version the compose file runs. */
function addDevDependency(context: Context, vcrPackage: string) {
  if (!context.doesFileExist('package.json')) {
    return;
  }

  let version = vcrPackage;
  if (vcrPackage === '@grafana/plugin-vcr') {
    version = 'latest';
  } else if (vcrPackage.startsWith('@grafana/plugin-vcr@')) {
    version = vcrPackage.slice('@grafana/plugin-vcr@'.length);
  }

  addDependenciesToPackageJson(context, {}, { '@grafana/plugin-vcr': version });
}

// only these plugin-ci-workflows entry points declare the playwright-docker-compose-file input
const CI_WORKFLOW_USES_REGEX = /^grafana\/plugin-ci-workflows\/\.github\/workflows\/(ci|cd)\.yml@/;

/**
 * Points plugin-ci-workflows' Playwright job at the vcr compose file. Returns whether any job ends up using
 * it, so the message can explain the manual change otherwise.
 */
function wireCiWorkflows(context: Context): boolean {
  let isWired = false;
  const workflows = context.readDir('.github/workflows').filter((file) => /\.ya?ml$/.test(file));

  for (const file of workflows) {
    const content = context.getFile(file);
    if (!content?.includes('grafana/plugin-ci-workflows/')) {
      continue;
    }

    const doc = parseDocument(content);
    const jobs = doc.get('jobs');
    if (!(jobs instanceof YAMLMap)) {
      continue;
    }

    let hasChanges = false;
    for (const job of jobs.items) {
      const uses = job.value instanceof YAMLMap ? job.value.get('uses') : undefined;
      if (typeof uses !== 'string' || !CI_WORKFLOW_USES_REGEX.test(uses)) {
        continue;
      }

      const path = [
        'jobs',
        String(job.key instanceof Scalar ? job.key.value : job.key),
        'with',
        'playwright-docker-compose-file',
      ];
      const existing = doc.getIn(path);
      if (existing === undefined) {
        doc.setIn(path, COMPOSE_FILE);
        hasChanges = true;
        isWired = true;
      } else if (existing === COMPOSE_FILE) {
        isWired = true;
      } else {
        additionsDebug(`${file} already points playwright-docker-compose-file at ${existing}. Skipping.`);
      }
    }

    if (hasChanges) {
      context.updateFile(file, stringifyYaml(doc));
    }
  }

  return isWired;
}

/** Services besides grafana, which extends doesn't bring into the vcr compose file. */
function findExtraServices(context: Context): string[] {
  const services = parseDocument(context.getFile('docker-compose.yaml') ?? '').get('services');
  if (!(services instanceof YAMLMap)) {
    return [];
  }

  return services.items
    .map((item) => String(item.key instanceof Scalar ? item.key.value : item.key))
    .filter((name) => name !== 'grafana');
}

function stringifyYaml(doc: Document<Node>): string {
  return stringify(doc, { lineWidth: 120, singleQuote: true });
}

interface NextStepsInput {
  vendor: Vendor;
  isCiWired: boolean;
  hasHosts: boolean;
  extraServices: string[];
  secretEnvVars: SecretEnvVar[];
}

function buildNextStepsMessage({
  vendor,
  isCiWired,
  hasHosts,
  extraServices,
  secretEnvVars,
}: NextStepsInput): ContextMessage {
  const { packageManagerName } = getPackageManagerFromUserAgent();
  const envPrefix = secretEnvVars.map(({ name }) => `${name}=<real value>`).join(' ');

  const steps = output.bulletList([
    `${output.formatCode(`${envPrefix ? `${envPrefix} ` : ''}${packageManagerName} run server:record`)} then use the plugin or run the e2e tests, to record`,
    `${output.formatCode('npx plugin-vcr fields --har e2e/recordings/api.har')} to review the recording before you commit it`,
    `${output.formatCode(`${packageManagerName} run server:replay`)} to replay with no credentials`,
  ]);

  const notes: string[] = [];

  if (!hasHosts) {
    notes.push(
      `Add the hosts your plugin calls to ${output.formatCode(CONFIG_FILE)}. While recording, the proxy logs every host it passes through.`
    );
  }
  if (vendor === 'google') {
    notes.push(
      'Google service accounts sign their token request locally, so replay needs a replay key. Refer to "Plugins that sign requests locally" in the plugin-vcr configuration docs.'
    );
  }
  if (!isCiWired) {
    notes.push(
      `In CI, start Grafana with ${output.formatCode(`docker compose -f ${COMPOSE_FILE} up -d`)} and remove the credentials your e2e job passes.`
    );
  }
  if (extraServices.length > 0) {
    notes.push(
      `${COMPOSE_FILE} only extends the grafana service. Copy ${extraServices.join(', ')} into it if the plugin needs them.`
    );
  }
  for (const { name } of secretEnvVars.filter(({ hasUnsupportedDefault }) => hasUnsupportedDefault)) {
    notes.push(
      `Provisioning uses a default in ${output.formatCode(`\${${name}:-...}`)}, which Grafana expands to an empty string. Use ${output.formatCode(`$${name}`)} instead.`
    );
  }
  notes.push("Use absolute time ranges in tests and dashboards, or replay won't find the recorded requests.");

  return {
    level: 'success',
    title: 'Successfully added plugin-vcr to your plugin.',
    body: ['Next steps:', ...steps, '', ...output.bulletList(notes), '', `Docs: ${DOCS_URL}`],
  };
}
