import { displayAsMarkdown } from '../../utils/utils.console';
import { normalizeId } from '../../utils/utils.handlebars';
import { getPackageManagerFromUserAgent } from '../../utils/utils.packageManager';
import { CliArgs } from '../types';

export function printGenerateSuccessMessage(answers: CliArgs) {
  const directory = normalizeId(answers.pluginName, answers.orgName, answers.pluginType);
  const { packageManagerName } = getPackageManagerFromUserAgent();
  const commands = [
    `- \`cd ./${directory}\``,
    `- \`${packageManagerName} install\` to install frontend dependencies.`,
    `- \`${packageManagerName} run dev\` to build (and watch) the plugin frontend code.`,
    ...(answers.hasBackend
      ? [
          '- `mage` to build the plugin backend code. Rerun this command every time you edit your backend files. `mage -l` lists all available targets.',
        ]
      : []),
    '- \`${packageManagerName} run server\` to start a grafana development server. Restart this command after each time you run mage to run your new backend code.',
    '- Open http://localhost:3000 in your browser to create a dashboard to begin developing your plugin.',
  ];

  const msg = `
Congratulations on scaffolding a Grafana ${answers.pluginType} plugin! 🚀

## What's next?

Run the following commands to get started:
${commands.map((command) => command).join('\n')}

_Note: We strongly recommend creating a new Git repository by running \`git init\` in ./${directory} before continuing._

- View create-plugin documentation at https://grafana.github.io/plugin-tools/
- Learn more about Grafana Plugins at https://grafana.com/docs/grafana/latest/plugins/developing/development/
`;

  return displayAsMarkdown(msg);
}
