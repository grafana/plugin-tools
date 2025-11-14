import type { Context } from '../context.js';
import { removeDependenciesFromPackageJson, addDependenciesToPackageJson } from '../utils.js';

export default function migrate(context: Context) {
  if (context.doesFileExist('./.config/types/setupTests.d.ts')) {
    const setupTestsContent = context.getFile('./.config/types/setupTests.d.ts');
    if (!setupTestsContent?.includes('@testing-library/jest-dom')) {
      context.updateFile(
        './.config/types/setupTests.d.ts',
        `import '@testing-library/jest-dom';\n${setupTestsContent}`
      );
    }
  } else {
    context.addFile('./.config/types/setupTests.d.ts', "import '@testing-library/jest-dom';\n");
  }

  if (context.doesFileExist('package.json')) {
    addDependenciesToPackageJson(context, {}, { '@testing-library/jest-dom': '^6.0.0' });
    removeDependenciesFromPackageJson(context, [], ['@types/testing-library__jest-dom']);
  }

  return context;
}
