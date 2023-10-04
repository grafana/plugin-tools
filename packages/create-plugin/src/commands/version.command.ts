import { getVersion } from '../utils/utils.version';

export const version = async () => {
  try {
    console.log(getVersion());
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};
