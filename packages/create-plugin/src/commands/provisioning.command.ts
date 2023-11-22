import glob from 'glob';
import path from 'path';
import fs from 'fs';
import { TEMPLATE_PATHS, TEXT } from '../constants';
import { getPluginJson } from '../utils/utils.plugin';
import { compileProvisioningTemplateFile, getTemplateData } from '../utils/utils.templates';
import { confirmPrompt, printMessage, printSuccessMessage, printError } from '../utils/utils.console';

export const provisioning = async () => {
  const { type } = getPluginJson();
  const provisioningFolder = path.join(process.cwd(), 'provisioning');
  try {
    if (await confirmPrompt(TEXT.addProvisioning)) {
      if (!fs.existsSync(provisioningFolder)) {
        const provisioningSpecificFiles = glob.sync(`${TEMPLATE_PATHS[type]}/provisioning/**`, { dot: true });

        provisioningSpecificFiles.forEach((file) => {
          compileProvisioningTemplateFile(type, file, getTemplateData());
        });
        printSuccessMessage(TEXT.addProvisioningSuccess);
      } else {
        printMessage(`You plugin already has provisioning files located under ${provisioningFolder}, aborting.`);
        process.exit(0);
      }
    } else {
      printMessage(TEXT.addProvisioningAborted);
      process.exit(1);
    }
  } catch (error) {
    printError(error);
  }
};
