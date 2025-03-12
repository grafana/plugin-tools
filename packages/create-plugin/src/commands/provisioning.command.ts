import { glob } from 'glob';
import path from 'node:path';
import fs from 'node:fs';
import { TEMPLATE_PATHS } from '../constants.js';
import { getPluginJson } from '../utils/utils.plugin.js';
import { compileProvisioningTemplateFile, getTemplateData } from '../utils/utils.templates.js';
import { confirmPrompt, output } from '../utils/utils.console.js';

export const provisioning = async () => {
  const { type } = getPluginJson();
  const provisioningFolder = path.join(process.cwd(), 'provisioning');
  try {
    if (await confirmPrompt('Do you want to add provisioning files?')) {
      if (!fs.existsSync(provisioningFolder)) {
        const provisioningSpecificFiles = glob.sync(`${TEMPLATE_PATHS[type]}/provisioning/**`, { dot: true });
        const templateData = getTemplateData();
        provisioningSpecificFiles.forEach((file) => {
          compileProvisioningTemplateFile(type, file, templateData);
        });
        output.success({
          title: 'Successfully added provisioning.',
          body: [`Provisioning files have been added to ${provisioningFolder}`],
        });
      } else {
        output.warning({
          title: 'No provisioning has been added.',
          body: [`This plugin already has provisioning files located at ${provisioningFolder}`],
        });
        process.exit(0);
      }
    } else {
      output.log({
        title: 'No provisioning has been added.',
      });
      process.exit(0);
    }
  } catch (error) {
    let message;
    if (error instanceof Error) {
      message = error.message;
    } else {
      message = String(error);
    }
    output.error({
      title: 'An error occurred whilst adding provisioning files.',
      body: [message],
    });
  }
};
