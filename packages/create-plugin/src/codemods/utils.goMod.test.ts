import { Context } from './context.js';
import { addRequireToGoMod } from './utils.goMod.js';

const GO_MOD = `module github.com/my-org/my-plugin

go 1.26.3

require github.com/grafana/grafana-plugin-sdk-go v0.285.0

require (
	github.com/BurntSushi/toml v1.5.0 // indirect
)
`;

describe('addRequireToGoMod', () => {
  it('inserts a new require line after the last existing one', () => {
    const context = new Context('/virtual');
    context.addFile('go.mod', GO_MOD);

    addRequireToGoMod(context, 'github.com/grafana/grafana-app-sdk', 'v0.59.1');

    const goMod = context.getFile('go.mod') ?? '';
    expect(goMod).toContain('require github.com/grafana/grafana-app-sdk v0.59.1');
    // The existing require survives, and the new one is inserted right after it.
    expect(goMod).toContain(
      'require github.com/grafana/grafana-plugin-sdk-go v0.285.0\nrequire github.com/grafana/grafana-app-sdk v0.59.1'
    );
    // The grouped require (...) block is left untouched.
    expect(goMod).toContain('require (\n\tgithub.com/BurntSushi/toml v1.5.0 // indirect\n)');
  });

  it('inserts after the go directive when there is no existing require line', () => {
    const context = new Context('/virtual');
    context.addFile('go.mod', 'module github.com/my-org/my-plugin\n\ngo 1.26.3\n');

    addRequireToGoMod(context, 'github.com/grafana/grafana-app-sdk', 'v0.59.1');

    const goMod = context.getFile('go.mod') ?? '';
    expect(goMod).toBe(
      'module github.com/my-org/my-plugin\n\ngo 1.26.3\nrequire github.com/grafana/grafana-app-sdk v0.59.1\n'
    );
  });

  it('does not duplicate an already-present dependency at the same version', () => {
    const context = new Context('/virtual');
    context.addFile('go.mod', GO_MOD);
    addRequireToGoMod(context, 'github.com/grafana/grafana-app-sdk', 'v0.59.1');
    const afterFirst = context.getFile('go.mod');

    addRequireToGoMod(context, 'github.com/grafana/grafana-app-sdk', 'v0.59.1');

    expect(context.getFile('go.mod')).toBe(afterFirst);
  });

  it('bumps the version when a greater one is requested', () => {
    const context = new Context('/virtual');
    context.addFile('go.mod', GO_MOD);
    addRequireToGoMod(context, 'github.com/grafana/grafana-app-sdk', 'v0.59.1');

    addRequireToGoMod(context, 'github.com/grafana/grafana-app-sdk', 'v0.60.0');

    const goMod = context.getFile('go.mod') ?? '';
    expect(goMod).toContain('require github.com/grafana/grafana-app-sdk v0.60.0');
    expect(goMod).not.toContain('v0.59.1');
  });

  it('does not downgrade when a lesser version is requested', () => {
    const context = new Context('/virtual');
    context.addFile('go.mod', GO_MOD);
    addRequireToGoMod(context, 'github.com/grafana/grafana-app-sdk', 'v0.60.0');

    addRequireToGoMod(context, 'github.com/grafana/grafana-app-sdk', 'v0.59.1');

    const goMod = context.getFile('go.mod') ?? '';
    expect(goMod).toContain('require github.com/grafana/grafana-app-sdk v0.60.0');
    expect(goMod).not.toContain('v0.59.1');
  });

  it('does nothing when go.mod does not exist', () => {
    const context = new Context('/virtual');

    addRequireToGoMod(context, 'github.com/grafana/grafana-app-sdk', 'v0.59.1');

    expect(context.doesFileExist('go.mod')).toBe(false);
  });
});
