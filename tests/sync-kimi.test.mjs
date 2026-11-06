import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import test from 'node:test';
import { repositoryRoot } from '../scripts/build-codex.mjs';

test('Kimi synchronization pulls Git and preserves installed and disabled choices', () => {
  const shell = process.platform === 'win32' ? 'powershell.exe' : 'pwsh';
  const result = spawnSync(shell, ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', join(repositoryRoot, 'tests/sync-kimi.Tests.ps1')], { encoding: 'utf8', timeout: 30000 });
  assert.equal(result.error, undefined, String(result.error));
  assert.equal(result.status, 0, result.stdout + result.stderr);
});
