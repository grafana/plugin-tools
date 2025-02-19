import 'vitest';
import { Context } from './src/migrations/context';

interface CustomMatchers<R = unknown> {
  toBeIdempotent(context: Context): Promise<void>;
}

declare module 'vitest' {
  interface Assertion<T = any> extends CustomMatchers<T> {}
  interface AsymmetricMatchersContaining extends CustomMatchers {}
}
