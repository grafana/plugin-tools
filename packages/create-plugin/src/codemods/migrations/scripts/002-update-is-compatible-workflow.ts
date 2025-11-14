import { type Context } from '../../context.js';
import { parseDocument, stringify, YAMLSeq } from 'yaml';

export default async function migrate(context: Context) {
  const workflowPath = './.github/workflows/is-compatible.yml';

  if (!context.doesFileExist(workflowPath)) {
    return context;
  }

  const workflowContent = context.getFile(workflowPath);

  if (!workflowContent) {
    return context;
  }

  const workflowDoc = parseDocument(workflowContent);
  const jobs = workflowDoc.getIn(['jobs']);

  if (!jobs) {
    return context;
  }

  // Find the jobs.compatibilitycheck.steps sequence
  const steps = workflowDoc.getIn(['jobs', 'compatibilitycheck', 'steps']);

  if (!(steps instanceof YAMLSeq)) {
    return context;
  }

  // Find the compatibility check step (case insensitive)
  const compatibilityStepIndex = steps.items.findIndex((step) => {
    const nameValue = step?.get('name')?.toString().toLowerCase();
    return nameValue && nameValue.includes('compatibility check');
  });

  // If we found the step, replace it with the two new steps
  if (compatibilityStepIndex !== -1) {
    // check if find module.ts step already exists
    // meaning the migration has already been applied
    const findModuleStepIndex = steps.items.findIndex((step) => {
      const nameValue = step?.get('name')?.toString().toLowerCase();
      return nameValue && nameValue.includes('find module.ts');
    });
    if (findModuleStepIndex !== -1) {
      return context;
    }

    // Create the two new steps
    const findModuleStep = {
      name: 'Find module.ts or module.tsx',
      id: 'find-module-ts',
      run: 'MODULETS="$(find ./src -type f \\( -name "module.ts" -o -name "module.tsx" \\))"\necho "modulets=${MODULETS}" >> $GITHUB_OUTPUT',
    };

    const compatibilityStep = {
      name: 'Compatibility check',
      uses: 'grafana/plugin-actions/is-compatible@main',
      with: {
        module: '${{ steps.find-module-ts.outputs.modulets }}',
        'comment-pr': 'no',
        'fail-if-incompatible': 'yes',
      },
    };

    // Replace the old step with the two new steps
    steps.items.splice(compatibilityStepIndex, 1, findModuleStep, compatibilityStep);

    // Write the updated workflow back to the file
    context.updateFile(workflowPath, stringify(workflowDoc));
  }

  return context;
}
