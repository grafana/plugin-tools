import parseArgs from 'minimist';
import { join } from 'node:path';

const args = process.argv.slice(2);

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
  default: {
    entryPoint: undefined,
    tsConfig: join(process.cwd(), 'tsconfig.json'),
    outDir: join(process.cwd(), 'dist'),
  },
});
