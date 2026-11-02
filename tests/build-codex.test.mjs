import assert from 'node:assert/strict';
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import test from 'node:test';
import { buildFiles, repositoryRoot, writeBuild } from '../scripts/build-codex.mjs';

test('all seven plugins and source agents are packaged with preserved launch requirements', () => {
  const output = buildFiles(repositoryRoot);
  const catalog = JSON.parse(output.get('.agents/plugins/marketplace.json'));
  assert.equal(catalog.plugins.length, 7);
  const kotlin = output.get('codex/plugins/anton-toolkit/skills/kotlin-dev/SKILL.md');
  assert.match(kotlin, /model="gpt-6\.1-sol", reasoning_effort="high", fork_turns="none"/);
  assert.match(kotlin, /skills\/kotlin-conventions\/SKILL\.md/);
  assert.match(kotlin, /skills\/karpathy-principles\/SKILL\.md/);
  assert.match(kotlin, /prohibited tools\/capabilities: \["Agent","Workflow"\]/);
  const reviewer = output.get('codex/plugins/anton-toolkit/skills/code-reviewer/SKILL.md');
  assert.match(reviewer, /model="gpt-6-astra", reasoning_effort="medium"/);
  assert.match(reviewer, /Source role tool allowlist/);
  assert.doesNotMatch(reviewer.split('Source role tool allowlist')[1].split('\n')[0], /"Write"|"Edit"/);
  const mr = output.get('codex/plugins/anton-toolkit/skills/mr-spec-reviewer/SKILL.md');
  assert.match(mr, /reasoning_effort="xhigh"/);
  assert.match(output.get('codex/plugins/anton-toolkit/skills/task-build/SKILL.md'), /the plan also pins the design/);
  const film = output.get('codex/plugins/lichnost/skills/film/SKILL.md');
  assert.match(film, /disable-model-invocation: true/);
  for (const [path, content] of output) {
    if (path.endsWith('.json')) JSON.parse(content);
    if (path.endsWith('SKILL.md')) {
      assert.ok(content.length > 100);
      assert.doesNotMatch(content, /C:\/projects\/obsidian\/\.codex-sync\/marketplace/);
    }
  }
});

test('Codex hooks retain review trust boundaries and native edit/commit matching', () => {
  const output = buildFiles(repositoryRoot);
  const hooks = JSON.parse(output.get('codex/plugins/anton-toolkit/hooks/hooks.json')).hooks;
  assert.equal(hooks.SubagentStop, undefined);
  assert.ok(hooks.PostToolUse.some(hook => new RegExp(hook.matcher).test('apply_patch')));
  assert.ok(hooks.PreToolUse.some(hook => new RegExp(hook.matcher).test('exec_command')));
  assert.match(output.get('codex/plugins/anton-toolkit/hooks/common.ps1'), /\.codex\/review-gate/);
  assert.match(output.get('codex/plugins/anton-toolkit/codex-runtime.md'), /Never programmatically approve hook trust/);
});

test('a source-only edit changes the Codex package version; removed resources disappear; rebuild is idempotent', () => {
  const fixture = mkdtempSync(join(tmpdir(), 'anton-toolkit-build-'));
  try {
    for (const directory of ['plugins', 'adapters', '.claude-plugin']) {
      cpSync(join(repositoryRoot, directory), join(fixture, directory), { recursive: true });
    }
    const first = writeBuild(fixture);
    assert.ok(first.changed > 0);
    assert.deepEqual(writeBuild(fixture), { files: first.files, changed: 0, removed: 0 });
    const manifest = join(fixture, 'codex/plugins/anton-toolkit/.codex-plugin/plugin.json');
    const before = JSON.parse(readFileSync(manifest, 'utf8')).version;
    const source = join(fixture, 'plugins/anton-toolkit/skills/task-build/SKILL.md');
    writeFileSync(source, readFileSync(source, 'utf8') + '\nA new source requirement.\n');
    assert.throws(() => writeBuild(fixture, true), /need rebuilding/);
    writeBuild(fixture);
    assert.notEqual(JSON.parse(readFileSync(manifest, 'utf8')).version, before);
    const resource = join(fixture, 'plugins/anton-toolkit/references/compose.md');
    rmSync(resource);
    writeBuild(fixture);
    assert.equal(existsSync(join(fixture, 'codex/plugins/anton-toolkit/references/compose.md')), false);
    assert.doesNotThrow(() => writeBuild(fixture, true));
    const modelsPath = join(fixture, 'adapters/codex/models.json');
    const models = JSON.parse(readFileSync(modelsPath, 'utf8'));
    models['anton-toolkit:missing-role'] = { model: 'gpt-6.1-sol', reasoning_effort: 'high' };
    writeFileSync(modelsPath, JSON.stringify(models));
    assert.throws(() => buildFiles(fixture), /missing agent/);
  } finally {
    assert.ok(resolve(fixture).startsWith(resolve(tmpdir()) + sep));
    rmSync(fixture, { recursive: true, force: true });
  }
});
