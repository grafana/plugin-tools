import { defineConfig, Options } from 'tsup';

export default defineConfig((options: Partial<Options>) => {
  const commonOptions: Partial<Options> = {
    entry: ['./src', '!src/**/*.test.ts'],
    clean: true,
    platform: 'node',
    target: 'node20',
    format: 'esm',
    dts: false,
    // Libraries are internal packages that need to be bundled because they are not published to NPM
    noExternal: ['@libs/**'],
    outExtension: () => {
      return {
        js: '.js',
      };
    },
    ...options,
  };

  return commonOptions;
});
