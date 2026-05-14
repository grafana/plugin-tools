import { modify, applyEdits } from 'jsonc-parser';
import type { Context } from '../../context.js';

export default function migrate(context: Context) {
  if (!context.doesFileExist('.config/tsconfig.json')) {
    return context;
  }

  const content = context.getFile('.config/tsconfig.json') || '';

  if (!content.includes('"baseUrl"')) {
    return context;
  }

  const formattingOptions = { formattingOptions: { insertSpaces: true, tabSize: 2 } };

  // applyEdits accepts Edit[] and modify returns Edit[], but both modify calls must operate on
  // the same base string to produce correct offsets. Chaining them sequentially is safer since
  // removing baseUrl shifts positions in compilerOptions before we add paths.
  const contentWithoutBaseUrl = applyEdits(
    content,
    modify(content, ['compilerOptions', 'baseUrl'], undefined, formattingOptions)
  );
  const contentWithPaths = applyEdits(
    contentWithoutBaseUrl,
    modify(contentWithoutBaseUrl, ['compilerOptions', 'paths', '*'], ['../src/*'], formattingOptions)
  );

  context.updateFile('.config/tsconfig.json', contentWithPaths);

  return context;
}
