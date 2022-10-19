import path from 'path';
import minimist from 'minimist';
import { Plop, run } from 'plop';

export const generate = async (argv: minimist.ParsedArgs) => {
  Plop.launch(
    {
      cwd: argv.cwd,
      configPath: path.join(__dirname, 'generate.plopfile.js'),
      require: argv.require,
      completion: argv.completion,
    },
    (env) => run(env, undefined, true)
  );
};
