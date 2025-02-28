import parseArgs from 'minimist';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
const __dirname = fileURLToPath(new URL('.', import.meta.url));

export type ParsedArgs = {
  entryPoint?: string;
  tsConfig: string;
  outDir: string;
};

export const parsedArgs = parseArgs<ParsedArgs>(args, {
  alias: {
    entryPoint: 'entry-point',
    tsConfig: 'ts-config',
    outDir: 'out-dir',
  },
  string: ['entryPoint', 'tsConfig', 'outDir'],
  unknown: (arg) => {
    console.error(`Unknown argument: ${arg}`);
    process.exit(1);
  },
});

export const DEFAULT_ARGS: ParsedArgs = {
  entryPoint: undefined,
  tsConfig: resolve(__dirname, '../tsconfig', 'tsconfig.json'),
  outDir: join(process.cwd(), 'dist'),
};
