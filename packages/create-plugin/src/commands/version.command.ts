import { CURRENT_APP_VERSION } from '../utils/utils.version.js';

export const version = async () => {
  try {
    console.log(CURRENT_APP_VERSION);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};
