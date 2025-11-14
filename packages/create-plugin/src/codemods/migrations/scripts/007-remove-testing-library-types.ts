import type { Context } from '../../context.js';
import { removeDependenciesFromPackageJson, isVersionGreater } from '../../utils.js';

export default function migrate(context: Context) {
  if (context.doesFileExist('package.json')) {
    const packageJson = JSON.parse(context.getFile('package.json') || '{}');
    if (isVersionGreater(packageJson.devDependencies['@testing-library/jest-dom'], '6.0.0', true)) {
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

      removeDependenciesFromPackageJson(context, [], ['@types/testing-library__jest-dom']);
    }
  }

  return context;
}
