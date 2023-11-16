import { Response } from '@playwright/test';
import { getMessage } from './utils';

const toBeOK = async (request: Promise<Response>) => {
  let pass = false;
  let actual;
  let message: any = 'Response status code is within 200..299 range.';

  try {
    const response = await request;
    return {
      message: () => getMessage(message, response.status().toString()),
      pass: response.ok(),
      actual: response.status(),
    };
  } catch (err: unknown) {
    return {
      message: () =>
        getMessage(
          'Response status code is within 200..299 range.',
          err instanceof Error ? err.toString() : 'Unknown error'
        ),
      pass,
      actual,
    };
  }
};

export default toBeOK;
