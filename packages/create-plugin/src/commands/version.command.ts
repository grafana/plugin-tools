import { output } from '../utils/utils.console.js';

export const version = async () => {
  try {
    output.log({ title: '' });
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};
