import { TEXT } from '../constants';
import { adoptCI } from '../utils/utils.templates';
import { confirmPrompt, printMessage, printSuccessMessage } from '../utils/utils.console';

export const cicd = async () => {
  if (await confirmPrompt(TEXT.adoptCIPrompt)) {
    adoptCI();
    printSuccessMessage(TEXT.adoptCISuccess);
  } else {
    printMessage(TEXT.adoptCIAborted);
  }
};
