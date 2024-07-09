import { TEXT } from '../constants.js';
import { adoptCI } from '../utils/utils.templates.js';
import { confirmPrompt, printMessage, printSuccessMessage } from '../utils/utils.console.js';

export const cicd = async () => {
  if (await confirmPrompt(TEXT.adoptCIPrompt)) {
    adoptCI();
    printSuccessMessage(TEXT.adoptCISuccess);
  } else {
    printMessage(TEXT.adoptCIAborted);
  }
};
