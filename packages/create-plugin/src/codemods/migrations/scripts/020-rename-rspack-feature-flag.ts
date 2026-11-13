import type { Context } from '../../context.js';
import { replaceExperimentalRspackFlag } from '../../utils.rspack.js';

// only renames the flag. plugins on the experimental rspack setup move to rspack 2 by running `add rspack`
export default function migrate(context: Context): Context {
  replaceExperimentalRspackFlag(context, { enable: false });
  return context;
}
