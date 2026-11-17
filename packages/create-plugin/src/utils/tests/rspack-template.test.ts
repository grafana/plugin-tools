import { readFileSync } from 'node:fs';

const rspackConfig = readFileSync(
  new URL('../../../templates/common/.config/rspack/rspack.config.ts', import.meta.url),
  'utf8'
);

describe('rspack config template', () => {
  it('uses the production React transform in development builds', () => {
    expect(rspackConfig).toContain('development: false');
    expect(rspackConfig).not.toContain('development: !env.production');
  });
});
