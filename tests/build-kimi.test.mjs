import assert from 'node:assert/strict';
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import test from 'node:test';
import { repositoryRoot } from '../scripts/build-codex.mjs';
import { buildFiles, writeBuild } from '../scripts/build-kimi.mjs';

test('all eight Kimi plugins contain native skills, agents and manifests', () => {
  const output = buildFiles(repositoryRoot);
  const catalog = JSON.parse(output.get('kimi/marketplace.json'));
  assert.equal(catalog.version, '2');
  assert.equal(catalog.plugins.length, 8);
  assert.equal([...output.keys()].filter(path => /kimi\/plugins\/[^/]+\/skills\/[^/]+\/SKILL\.md$/.test(path)).length, 42);
  assert.equal([...output.keys()].filter(path => /kimi\/plugins\/[^/]+\/agents\/[^/]+\.md$/.test(path)).length, 17);

  const reviewer = output.get('kimi/plugins/anton-toolkit/agents/code-reviewer.md');
  assert.match(reviewer, /^name: code-reviewer$/m);
  assert.match(reviewer, /^tools:/m);
  assert.match(reviewer, /skills\/karpathy-principles\/SKILL\.md/);
  assert.doesNotMatch(reviewer, /^model:|^effort:|^memory:/m);
  assert.match(output.get('kimi/plugins/anton-toolkit/agents/kotlin-dev.md'), /skills\/kotlin-conventions\/SKILL\.md/);
  assert.doesNotMatch(output.get('kimi/plugins/anton-toolkit/agents/kotlin-dev.md').split('---')[1], /Workflow/);

  const commit = output.get('kimi/plugins/anton-toolkit/skills/commit/SKILL.md');
  assert.match(commit, /^when_to_use:/m);
  assert.match(output.get('kimi/plugins/lichnost/skills/film/SKILL.md'), /disable-model-invocation: true/);
  assert.match(output.get('kimi/plugins/anton-toolkit/kimi-runtime.md'), /bare `role` name/);
  const youtube = JSON.parse(output.get('kimi/plugins/youtube-toolkit/kimi.plugin.json')).mcpServers.youtube;
  assert.equal(youtube.command, 'cmd.exe');
  assert.deepEqual(youtube.args, ['/d', '/s', '/c', 'npx', '-y', 'youtube-data-mcp-server']);

  for (const [path, content] of output) {
    if (path.endsWith('.json')) JSON.parse(content);
    if (path.endsWith('SKILL.md') || path.includes('/agents/')) {
      assert.ok(content.length > 100);
      assert.doesNotMatch(content, /\$\{CLAUDE_(?:PLUGIN_ROOT|SKILL_DIR)\}/);
    }
  }
});

test('a source-only edit changes the Kimi package version; removed resources disappear; rebuild is idempotent', () => {
  const fixture = mkdtempSync(join(tmpdir(), 'anton-toolkit-kimi-build-'));
  try {
    for (const directory of ['plugins', 'adapters', '.claude-plugin']) {
      cpSync(join(repositoryRoot, directory), join(fixture, directory), { recursive: true });
    }
    const first = writeBuild(fixture);
    assert.ok(first.changed > 0);
    assert.deepEqual(writeBuild(fixture), { files: first.files, changed: 0, removed: 0 });
    const manifest = join(fixture, 'kimi/plugins/anton-toolkit/kimi.plugin.json');
    const before = JSON.parse(readFileSync(manifest, 'utf8')).version;
    const source = join(fixture, 'plugins/anton-toolkit/skills/task-build/SKILL.md');
    writeFileSync(source, readFileSync(source, 'utf8') + '\nA new source requirement.\n');
    assert.throws(() => writeBuild(fixture, true), /need rebuilding/);
    writeBuild(fixture);
    assert.notEqual(JSON.parse(readFileSync(manifest, 'utf8')).version, before);
    const resource = join(fixture, 'plugins/anton-toolkit/references/compose.md');
    rmSync(resource);
    writeBuild(fixture);
    assert.equal(existsSync(join(fixture, 'kimi/plugins/anton-toolkit/references/compose.md')), false);
    assert.doesNotThrow(() => writeBuild(fixture, true));
  } finally {
    assert.ok(resolve(fixture).startsWith(resolve(tmpdir()) + sep));
    rmSync(fixture, { recursive: true, force: true });
  }
});
