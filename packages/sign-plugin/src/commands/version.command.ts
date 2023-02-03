import { getVersion } from '../utils/getVersion';

export const version = async () => {
  try {
    console.log(getVersion());
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};
