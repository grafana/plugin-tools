import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { parseHandoff } from './handoff.js';
import { AgentSessionResult, Handoff } from './types.js';

const DEFAULT_POLL_INTERVAL_MS = 500;
const DEFAULT_KILL_GRACE_MS = 5000;

export interface AgentSessionOptions {
  binaryPath: string;
  args: string[];
  env?: Record<string, string>;
  cwd: string;
  handoffPath: string;
  pollIntervalMs?: number;
  killGraceMs?: number;
}

export function runAgentSession(options: AgentSessionOptions): Promise<AgentSessionResult> {
  const pollIntervalMs = options.pollIntervalMs ?? DEFAULT_POLL_INTERVAL_MS;
  const killGraceMs = options.killGraceMs ?? DEFAULT_KILL_GRACE_MS;

  return new Promise((resolve) => {
    const child = spawn(options.binaryPath, options.args, {
      stdio: 'inherit',
      cwd: options.cwd,
      env: { ...process.env, ...options.env },
    });

    let settled = false;
    // set once the poller finds a valid handoff; the session is then being torn down
    // and the exit handler must report the handoff rather than classify the exit
    let pendingHandoff: Handoff | undefined;
    let killTimer: NodeJS.Timeout | undefined;

    const pollTimer = setInterval(async () => {
      const handoff = await readHandoff(options.handoffPath);
      if (!handoff || settled || pendingHandoff) {
        return;
      }
      pendingHandoff = handoff;
      clearInterval(pollTimer);
      child.kill('SIGINT');
      killTimer = setTimeout(() => child.kill('SIGKILL'), killGraceMs);
    }, pollIntervalMs);

    function settle(result: AgentSessionResult) {
      if (settled) {
        return;
      }
      settled = true;
      clearInterval(pollTimer);
      if (killTimer) {
        clearTimeout(killTimer);
      }
      resetTerminal();
      resolve(result);
    }

    child.on('error', () => {
      settle({ outcome: 'ambiguous-exit', exitCode: null, signal: null });
    });

    child.on('exit', async (exitCode, signal) => {
      if (pendingHandoff) {
        settle({ outcome: 'handoff', handoff: pendingHandoff });
        return;
      }
      // the agent may write the handoff and end the session on its own before the poller fires
      const handoff = await readHandoff(options.handoffPath);
      if (handoff) {
        settle({ outcome: 'handoff', handoff });
        return;
      }
      if (isUserAbort(exitCode, signal)) {
        settle({ outcome: 'user-aborted' });
        return;
      }
      settle({ outcome: 'ambiguous-exit', exitCode, signal });
    });
  });
}

async function readHandoff(handoffPath: string): Promise<Handoff | undefined> {
  try {
    const raw = await readFile(handoffPath, 'utf-8');
    return parseHandoff(raw);
  } catch {
    // tolerate ENOENT while the agent is still working (and cache dir pruning mid-session)
    return undefined;
  }
}

function isUserAbort(exitCode: number | null, signal: NodeJS.Signals | null): boolean {
  return exitCode === 130 || exitCode === 143 || signal === 'SIGINT' || signal === 'SIGTERM';
}

function resetTerminal(): void {
  if (process.stdout.isTTY) {
    // clear any styling the killed agent TUI left behind on the inherited stdio
    process.stdout.write('\x1B[0m\n');
  }
}
