import glob from 'glob';
import { TEMPLATE_PATHS, TEXT } from '../constants';
import { compileProvisioningTemplateFile, getTemplateData } from '../utils/utils.templates';
import { confirmPrompt, printMessage, printSuccessMessage } from '../utils/utils.console';

export const provisioning = async () => {
  try {
    if (await confirmPrompt(TEXT.updateProvisioning)) {
      const provisioningSpecificFiles = glob.sync(`${TEMPLATE_PATHS.provisioning}/**`, { dot: true });

      provisioningSpecificFiles.map((file) => {
        compileProvisioningTemplateFile(file, getTemplateData());
      });
      printSuccessMessage(TEXT.updateProvisioningSuccess);
    } else {
      printMessage(TEXT.updateProvisioningAborted);
      process.exit(0);
    }
  } catch (error) {
    console.error(error);
  }
};
