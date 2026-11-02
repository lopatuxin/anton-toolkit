import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import test from 'node:test';
import { repositoryRoot } from '../scripts/build-codex.mjs';

test('client synchronization preserves installed/disabled choices and migrates the old local source', () => {
  const shell = process.platform === 'win32' ? 'powershell.exe' : 'pwsh';
  const result = spawnSync(shell, ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', join(repositoryRoot, 'tests/sync-marketplace.Tests.ps1')], { encoding: 'utf8', timeout: 30000 });
  assert.equal(result.error, undefined, String(result.error));
  assert.equal(result.status, 0, result.stdout + result.stderr);
});
