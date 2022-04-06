import { confirmPrompt, selectPrompt, printMarkdown } from '../../utils/utils.cli';
import { getTemplateFiles, renderAndCopyTemplateFile } from '../../utils/utils.templates';
import { getPluginJson, updatePackageJson } from '../../utils/utils.plugin';

export const update = async () => {
  try {
    const TEMPLATE_SUBFOLDER = '.config';

    printMarkdown('# Update plugin...');
    printMarkdown(
      '**⚠️  Warning!**\nThis is going to update files under the `.config/` folder.\nMake sure to commit your changes before running this script.'
    );

    // Initial confirmation
    const confirmed = await confirmPrompt('Would you like to continue?');
    if (!confirmed) {
      console.log('');
      console.log('Update aborted.');
      process.exit(0);
    }

    // Find the `plugin.json` and load plugin-specific data
    const pluginJson = getPluginJson();
    const data = {
      pluginId: pluginJson.id,
      pluginName: pluginJson.name,
      pluginDescription: pluginJson.info?.description,
      hasBackend: Boolean(pluginJson.backend),
      orgName: pluginJson.info?.author?.name,
      pluginType: pluginJson.type,
    };

    // Find, render & copy template files under `.config/`
    const configTemplateFiles = getTemplateFiles(pluginJson.type, TEMPLATE_SUBFOLDER);
    configTemplateFiles.forEach((templateFile) => renderAndCopyTemplateFile(pluginJson.type, templateFile, data));

    // Update dependencies inside the `package.json`
    const PROMPT_CHOICES = {
      ALL: 'Yes, all of them',
      ONLY_OUTDATED: 'Yes, but only the outdated ones',
      NONE: 'No',
    };
    const shouldUpdateDeps = await selectPrompt('Would you like to update the dependencies in the `package.json?`', [
      PROMPT_CHOICES.ALL,
      PROMPT_CHOICES.ONLY_OUTDATED,
      PROMPT_CHOICES.NONE,
    ]);
    if (shouldUpdateDeps !== PROMPT_CHOICES.NONE) {
      updatePackageJson({ onlyOutdated: shouldUpdateDeps === PROMPT_CHOICES.ONLY_OUTDATED, logging: true });
    }

    // Print summary
    console.log('');
    printMarkdown(
      '✔️  **Done.**\nIf you have any questions please open an issue/discussion in https://github.com/grafana/create-plugin.'
    );
  } catch (error) {
    console.error(error);
  }
};
