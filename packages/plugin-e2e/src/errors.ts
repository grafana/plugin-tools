export const formatExpectError = (message: string, context: string, additionalText?: string) => {
  return `@grafana/plugin-e2e error: ${message}. 
  The error occurred in: ${context}.
  Was the UI for this page changed?`;
};
