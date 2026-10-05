/**
 * `chain` with no args reads its JSON from stdin. On Windows,
 * `await Bun.stdin.text()` inside the un-awaited main() never kept the event
 * loop alive, so the CLI exited 0 before reading stdin: no output, no error,
 * nothing sent to the daemon. The CLI now reads stdin synchronously.
 */
import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

const CLI = path.resolve(import.meta.dir, '../src/cli.ts');

describe('chain reads its JSON from stdin', () => {
  let scratch: string;
  let daemon: ReturnType<typeof Bun.serve>;
  let received: { command: string; args: string[] } | null;

  beforeEach(() => {
    scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'browse-chain-stdin-'));
    received = null;
    daemon = Bun.serve({
      hostname: '127.0.0.1',
      port: 0,
      fetch: async (req) => {
        const url = new URL(req.url);
        if (url.pathname === '/health') return Response.json({ status: 'healthy' });
        if (url.pathname === '/command') {
          received = await req.json();
          return new Response('chain ran');
        }
        return new Response('not found', { status: 404 });
      },
    });
  });

  afterEach(() => {
    try { daemon.stop(true); } catch {}
    fs.rmSync(scratch, { recursive: true, force: true });
  });

  test('piped JSON reaches the daemon as the chain argument', async () => {
    const stateFile = path.join(scratch, 'browse.json');
    fs.writeFileSync(stateFile, JSON.stringify({ pid: process.pid, port: daemon.port, token: 'chain-stdin-test', mode: 'launched' }));
    const env: Record<string, string> = {};
    for (const [key, value] of Object.entries(process.env)) {
      if (value !== undefined && !/^(BROWSE_|GSTACK_)/.test(key)) env[key] = value;
    }
    Object.assign(env, { HOME: scratch, GSTACK_HOME: path.join(scratch, '.gstack'), BROWSE_STATE_FILE: stateFile });

    const flow = '[["js","1+1"]]';
    const cli = Bun.spawn([process.execPath, CLI, 'chain'], {
      cwd: scratch, env, stdin: new TextEncoder().encode(flow), stdout: 'pipe', stderr: 'pipe',
    });
    const timer = setTimeout(() => cli.kill('SIGKILL'), 30_000);
    const [code, stdout, stderr] = await Promise.all([cli.exited, new Response(cli.stdout).text(), new Response(cli.stderr).text()]);
    clearTimeout(timer);

    expect(code, stdout + stderr).toBe(0);
    expect(received).toEqual({ command: 'chain', args: [flow] });
    expect(stdout).toContain('chain ran');
  }, 45_000);
});
