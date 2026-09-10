import { Context } from '../codemods/context.js';
import { add } from './add.command.js';
import { output } from '../utils/utils.console.js';
import { runCodemod } from '../codemods/runner.js';
import { vi } from 'vitest';

vi.mock('../codemods/runner.js', () => ({ runCodemod: vi.fn() }));
vi.mock('../utils/utils.checks.js', () => ({ performPreCodemodChecks: vi.fn() }));

// example-addition is registered in additions.ts, so `add` resolves it without a fixture
const argv = { _: ['add', 'example-addition'], $0: 'create-plugin' };

describe('add command', () => {
  // the order these are called in is the whole point of the change, so record it rather than
  // asserting on each in isolation
  let calls: string[];

  beforeEach(() => {
    calls = [];
    vi.spyOn(output, 'success').mockImplementation(({ title }) => {
      calls.push(`success: ${title}`);
    });
    vi.spyOn(output, 'warning').mockImplementation(({ title }) => {
      calls.push(`warning: ${title}`);
    });
    vi.spyOn(output, 'log').mockImplementation(({ title }) => {
      calls.push(`log: ${title}`);
    });
    vi.spyOn(output, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('reports success and then the next steps, in that order', async () => {
    const context = new Context('/virtual');
    context.addNextStep('do the thing');
    vi.mocked(runCodemod).mockResolvedValue(context);

    await add(argv);

    expect(calls).toEqual(['success: Successfully added example-addition to your plugin.', 'log: Next steps']);
  });

  it('says nothing about next steps when the codemod recorded none', async () => {
    vi.mocked(runCodemod).mockResolvedValue(new Context('/virtual'));

    await add(argv);

    expect(calls).toEqual(['success: Successfully added example-addition to your plugin.']);
  });

  // the runner explains the skip itself, so the command's only job is to stay quiet about success
  it('does not claim success when the codemod skipped', async () => {
    const context = new Context('/virtual');
    context.skip('this is not an app plugin.', ['Run it against an app plugin.']);
    vi.mocked(runCodemod).mockResolvedValue(context);

    await add(argv);

    expect(calls).toEqual([]);
  });

  it('keeps next steps recorded by a codemod that then skipped', async () => {
    const context = new Context('/virtual');
    context.addNextStep('add a backend, then run this again');
    context.skip('this plugin has no backend.');
    vi.mocked(runCodemod).mockResolvedValue(context);

    await add(argv);

    expect(calls).toEqual(['log: Next steps']);
  });
});
