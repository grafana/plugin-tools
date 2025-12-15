import type { Context } from '../../context.js';
import { addDependenciesToPackageJson, isVersionGreater } from '../../utils.js';

export default function migrate(context: Context) {
  if (context.doesFileExist('package.json')) {
    const packageJson = JSON.parse(context.getFile('package.json') || '{}');
    if (packageJson.dependencies?.react) {
      if (isVersionGreater(packageJson.dependencies.react, '18.0.0', true)) {
        addDependenciesToPackageJson(context, { react: '^18.3.0' }, { '@types/react': '^18.3.0' });
      }
    }
    if (packageJson.dependencies?.['react-dom']) {
      if (isVersionGreater(packageJson.dependencies['react-dom'], '18.0.0', true)) {
        addDependenciesToPackageJson(context, { 'react-dom': '^18.3.0' }, { '@types/react-dom': '^18.3.0' });
      }
    }
  }
  return context;
}
