import { join } from 'node:path';
import { TEMPLATE_PATHS } from '../../../constants.js';
import type { Context } from '../../context.js';
import { renderTemplate } from '../../utils.js';

const README_PATH = '.config/README.md';
const CONFIG_SECTIONS = [
  {
    name: 'ESLint',
    configFile: 'eslint.config.mjs',
    legacyReference: /\.\/\.config\/\.eslintrc/,
  },
  {
    name: 'Jest',
    configFile: '.config/jest/utils.js',
    legacyReference: /\.\/config\/jest\/utils/,
  },
  {
    name: 'Webpack',
    configFile: '.config/webpack/webpack.config.ts',
    legacyReference: /(['"])\.\/\.config\/webpack\/webpack\.config\1/,
  },
];

export default function migrate(context: Context): Context {
  if (!context.doesFileExist(README_PATH)) {
    return context;
  }

  const readme = context.getFile(README_PATH) ?? '';
  const template = renderTemplate(join(TEMPLATE_PATHS.common, README_PATH), false, {});
  let updated = readme;

  for (const { name, configFile, legacyReference } of CONFIG_SECTIONS) {
    if (!context.doesFileExist(configFile)) {
      continue;
    }

    const section = new RegExp(`### Extending the ${name} config[\\s\\S]*?(?=\\n### |$)`);
    const oldSection = updated.match(section)?.[0];
    if (!oldSection || !legacyReference.test(oldSection)) {
      continue;
    }

    const newSection = template.match(section)![0];
    updated = updated.replace(oldSection, newSection);
  }

  if (updated !== readme) {
    context.updateFile(README_PATH, updated);
  }
  return context;
}
