import { CodeGenPlugin } from './CodeGenPlugin';
import type { Configuration } from 'webpack';

const config: Configuration = {
  mode: 'development',
  entry: {},
  plugins: [new CodeGenPlugin()],
};

export default config;
