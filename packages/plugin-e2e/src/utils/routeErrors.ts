// returns true for errors that occur when the page/context is torn down mid-request
export function isTeardownError(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.message.includes('Target page, context or browser has been closed') ||
      error.message.includes('Fetch response has been disposed') ||
      error.message.includes('Response has been disposed') ||
      error.message.includes('Test ended') ||
      error.message.includes('Test timeout of'))
  );
}

// Playwright appends a multi-line call log to error messages, so keep only the first line
export function summarizeError(error: unknown): string {
  return error instanceof Error ? error.message.split('\n')[0] : String(error);
}
