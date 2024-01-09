import { Response } from '@playwright/test';
import { getMessage } from './utils';

const toBeOK = async (response: Response) => {
  return {
    pass: response.ok(),
    actual: response.status(),
    message: () => getMessage('Response status code is within 200..299 range.', response.status().toString()),
  };
};

export default toBeOK;
