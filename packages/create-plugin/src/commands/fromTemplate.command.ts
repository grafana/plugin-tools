import minimist from 'minimist';
import { ReadableStream } from 'node:stream/web';
import { Readable } from 'stream';
import { pipeline } from 'stream/promises';
import { extract } from 'tar';
import { GITHUB_EXAMPLES_REPO, PLUGIN_TYPES } from '../constants.js';
import { getFromTemplatePrompts, promptUser } from './generate/prompt-user.js';
import { basename, join } from 'node:path';
import { exit } from 'node:process';
import { getExportPath } from '../utils/utils.path.js';
import { directoryExists, isFile } from '../utils/utils.files.js';
import { lstat, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { getPluginJson } from '../utils/utils.plugin.js';
import { normalizeId } from '../utils/utils.handlebars.js';
import { displayAsMarkdown } from '../utils/utils.console.js';
import { getPackageManagerFromUserAgent } from '../utils/utils.packageManager.js';
import { ExampleMetaData } from '../types.js';

const EXTRACTED_REPO_NAME = 'grafana-plugin-examples-main';

export const fromTemplate = async (argv: minimist.ParsedArgs) => {
  try {
    const templateList = await getTemplateList();
    const prompts = getFromTemplatePrompts(templateList);
    const answers = await promptUser(argv, prompts);
    const chosenTemplate = templateList.find((template) => template.name === answers.template);
    if (!chosenTemplate) {
      throw new Error(`Template not found: ${answers.template}`);
    }
    const templatePluginType = chosenTemplate.name.split('-')[0] as PLUGIN_TYPES;
    const exportPath = getExportPath(answers.pluginName, answers.orgName, templatePluginType);
    const pathExists = await directoryExists(exportPath);
    if (!pathExists) {
      await mkdir(exportPath, { recursive: true });
    }
    await downloadAndExtractRepo(exportPath, join(EXTRACTED_REPO_NAME, chosenTemplate.path));
    const originalPluginId = getPluginJson(join(exportPath, 'src')).id;
    const replacementPluginId = normalizeId(answers.pluginName, answers.orgName, templatePluginType);
    console.log('Processing template...');
    await processTemplateDirectory(exportPath, originalPluginId, replacementPluginId);
    const { packageManagerName } = getPackageManagerFromUserAgent();
    const hasBackend = isFile(join(exportPath, 'go.mod'));
    const directory = basename(exportPath);

    printSuccessMessage(directory, packageManagerName, hasBackend, chosenTemplate, templatePluginType);
  } catch (error) {
    if (error instanceof Error) {
      console.error(error.message);
    }
    exit(1);
  }
};

async function getTemplateList(): Promise<ExampleMetaData[]> {
  const apiUrl = `https://api.github.com/repos/${GITHUB_EXAMPLES_REPO}/contents/index.json?ref=jackw/example-metadata`;
  const response = await fetch(apiUrl, {
    headers: { Accept: 'application/vnd.github+json' },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch example list from ${apiUrl}`);
  }

  const jsonRes = (await response.json()) as { content: string };

  return JSON.parse(atob(jsonRes.content));
}

async function downloadAndExtractRepo(exportPath: string, pathFilter: string) {
  await pipeline(
    await downloadTarStream(`https://codeload.github.com/${GITHUB_EXAMPLES_REPO}/tar.gz/main`),
    extract({
      cwd: exportPath,
      strip: pathFilter.split('/').length,
      filter: (path) => path.startsWith(pathFilter),
    })
  );
}

async function downloadTarStream(url: string) {
  console.log('Downloading template...');
  const res = await fetch(url);

  if (!res.body) {
    throw new Error(`Failed to download: ${url}`);
  }

  return Readable.fromWeb(res.body as ReadableStream);
}

async function processTemplateDirectory(dir: string, originalPluginId: string, replacementPluginId: string) {
  const files = await readdir(dir);
  for (const file of files) {
    const fullPath = join(dir, file);
    const stats = await lstat(fullPath);
    if (stats.isDirectory()) {
      await processTemplateDirectory(fullPath, originalPluginId, replacementPluginId);
    } else if (stats.isFile()) {
      await processFile(fullPath, originalPluginId, replacementPluginId);
    }
  }
}

async function processFile(filePath: string, originalPluginId: string, replacementPluginId: string) {
  try {
    const data = await readFile(filePath, 'utf8');
    const result = data.replace(new RegExp(originalPluginId, 'g'), replacementPluginId);

    if (result !== data) {
      await writeFile(filePath, result, 'utf8');
    }
  } catch (error) {
    console.error(`Error processing file: ${filePath}`, error);
  }
}

// TODO: Rework generate/print-success-message.ts and remove this duplication.
function printSuccessMessage(
  directory: string,
  packageManagerName: string,
  hasBackend: boolean,
  chosenTemplate: ExampleMetaData,
  templatePluginType: PLUGIN_TYPES
) {
  const commands = [
    `- \`cd ./${directory}\``,
    `- \`${packageManagerName} install\` to install frontend dependencies.`,
    `- \`${packageManagerName} exec playwright install chromium\` to install e2e test dependencies.`,
    `- \`${packageManagerName} run dev\` to build (and watch) the plugin frontend code.`,
    ...(hasBackend
      ? [
          '- `mage -v build:linux` to build the plugin backend code. Rerun this command every time you edit your backend files.',
        ]
      : []),
    '- `docker-compose up` to start a grafana development server.',
    '- Open http://localhost:3000 in your browser to create a dashboard to begin developing your plugin.',
  ];

  const msg = `\n# Congratulations on scaffolding a Grafana ${templatePluginType} plugin! 🚀

  Your plugin has been scaffolded based on the template: ${chosenTemplate.url.trim()}

  ## What's next?

  Run the following commands to get started:
  ${commands.map((command) => command).join('\n')}

  _Note: We strongly recommend creating a new Git repository by running \`git init\` in ./${directory} before continuing._

  - Learn more about Grafana Plugin Development at https://grafana.com/developers/plugin-tools
    `;

  console.log(displayAsMarkdown(msg));
}
