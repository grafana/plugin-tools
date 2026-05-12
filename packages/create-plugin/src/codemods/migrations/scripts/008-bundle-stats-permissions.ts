import { type Context } from '../../context.js';
import { parseDocument, stringify } from 'yaml';

export default async function migrate(context: Context) {
  const workflowPath = './.github/workflows/bundle-stats.yml';

  if (!context.doesFileExist(workflowPath)) {
    return context;
  }

  const workflowContent = context.getFile(workflowPath);

  if (!workflowContent) {
    return context;
  }

  const workflowDoc = parseDocument(workflowContent);

  if (!workflowDoc.hasIn(['permissions', 'contents'])) {
    return context;
  }

  if (workflowDoc.getIn(['permissions', 'contents']) === 'read') {
    return context;
  }

  workflowDoc.setIn(['permissions', 'contents'], 'read');
  context.updateFile(workflowPath, stringify(workflowDoc));

  return context;
}
