import { displayAsMarkdown } from '../../utils/utils.console.js';
import { normalizeId } from '../../utils/utils.handlebars.js';
import { getPackageManagerFromUserAgent } from '../../utils/utils.packageManager.js';
import { TemplateData } from '../../types.js';

export function printGenerateSuccessMessage(answers: TemplateData) {
  const directory = normalizeId(answers.pluginName, answers.orgName, answers.pluginType);
  const { packageManagerName } = getPackageManagerFromUserAgent();
  const commands = [
    `- \`cd ./${directory}\``,
    `- \`${packageManagerName} install\` to install frontend dependencies.`,
    `- \`${packageManagerName} exec playwright install chromium\` to install e2e test dependencies.`,
    `- \`${packageManagerName} run dev\` to build (and watch) the plugin frontend code.`,
    ...(answers.hasBackend
      ? [
          '- `mage -v build:linux` to build the plugin backend code. Rerun this command every time you edit your backend files.',
        ]
      : []),
    '- `docker-compose up` to start a grafana development server.',
    '- Open http://localhost:3000 in your browser to create a dashboard to begin developing your plugin.',
  ];

  const msg = `\n# Congratulations on scaffolding a Grafana ${answers.pluginType} plugin! 🚀

## What's next?

Run the following commands to get started:
${commands.map((command) => command).join('\n')}

_Note: We strongly recommend creating a new Git repository by running \`git init\` in ./${directory} before continuing._

- Learn more about Grafana Plugin Development at https://grafana.com/developers/plugin-tools
`;

  console.log(displayAsMarkdown(msg));
}
