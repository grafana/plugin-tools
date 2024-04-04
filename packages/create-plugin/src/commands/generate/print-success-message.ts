import { displayAsMarkdown } from '../../utils/utils.console.js';
import { normalizeId } from '../../utils/utils.templates.js';
import { getPackageManagerFromUserAgent } from '../../utils/utils.packageManager.js';
import { CliArgs, TemplateData } from '../../types.js';

export function printGenerateSuccessMessage(templateData: TemplateData) {
  const directory = normalizeId(templateData.pluginName, templateData.orgName, templateData.pluginType);
  const { packageManagerName } = getPackageManagerFromUserAgent();
  const commands = [
    `- \`cd ./${directory}\``,
    `- \`${packageManagerName} install\` to install frontend dependencies.`,
    `- \`${packageManagerName} run dev\` to build (and watch) the plugin frontend code.`,
    ...(templateData.hasBackend
      ? [
          '- `mage -v build:linux` to build the plugin backend code. Rerun this command every time you edit your backend files.',
        ]
      : []),
    '- `docker-compose up` to start a grafana development server. ' +
      (answers.hasBackend
        ? 'The plugin backend will be reloaded on every code change and a debugger can be attached on port `2345`.'
        : ''),
    '- Open http://localhost:3000 in your browser to create a dashboard to begin developing your plugin.',
  ];

  const msg = `\n# Congratulations on scaffolding a Grafana ${templateData.pluginType} plugin! 🚀

## What's next?

Run the following commands to get started:
${commands.map((command) => command).join('\n')}

_Note: We strongly recommend creating a new Git repository by running \`git init\` in ./${directory} before continuing._

- Learn more about Grafana Plugin Development at https://grafana.com/developers/plugin-tools
`;

  console.log(displayAsMarkdown(msg));
}
