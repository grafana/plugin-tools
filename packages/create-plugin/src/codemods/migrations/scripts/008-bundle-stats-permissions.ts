import { type Context } from '../../context.js';
import { parseDocument, stringify } from 'yaml';

const workflowPaths = ['./.github/workflows/bundle-stats.yml', './.github/workflows/bundle-size.yml'];

export default async function migrate(context: Context) {
  for (const workflowPath of workflowPaths) {
    if (!context.doesFileExist(workflowPath)) {
      continue;
    }

    const workflowContent = context.getFile(workflowPath);

    if (!workflowContent) {
      continue;
    }

    const workflowDoc = parseDocument(workflowContent);

    if (workflowDoc.getIn(['permissions', 'contents']) !== 'write') {
      continue;
    }

    workflowDoc.setIn(['permissions', 'contents'], 'read');
    context.updateFile(workflowPath, stringify(workflowDoc));
  }

  return context;
}
