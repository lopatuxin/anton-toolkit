import assert from 'node:assert/strict';
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import test from 'node:test';
import { repositoryRoot } from '../scripts/build-codex.mjs';
import { buildFiles, writeBuild } from '../scripts/build-qwen.mjs';

test('all eight Qwen plugins contain native skills, agents and manifests', () => {
  const output = buildFiles(repositoryRoot);
  const catalog = JSON.parse(output.get('qwen/marketplace.json'));
  assert.equal(catalog.version, '2');
  assert.equal(catalog.plugins.length, 8);
  assert.equal([...output.keys()].filter(path => /qwen\/plugins\/[^/]+\/skills\/[^/]+\/SKILL\.md$/.test(path)).length, 45);
  assert.ok(output.has('qwen/plugins/anton-toolkit/skills/task-interview/SKILL.md'));
  assert.equal([...output.keys()].filter(path => /qwen\/plugins\/[^/]+\/agents\/[^/]+\.md$/.test(path)).length, 17);

  const reviewer = output.get('qwen/plugins/anton-toolkit/agents/code-reviewer.md');
  assert.match(reviewer, /^name: code-reviewer$/m);
  assert.match(reviewer, /- read_file/);
  assert.match(reviewer, /- run_shell_command/);
  assert.doesNotMatch(reviewer, /"Read"|"Bash"/);
  assert.match(reviewer, /skills\/karpathy-principles\/SKILL\.md/);
  assert.doesNotMatch(reviewer, /^model:|^effort:|^memory:/m);
  const javaDev = output.get('qwen/plugins/anton-toolkit/agents/java-dev.md');
  assert.match(javaDev, /skills\/java-conventions\/SKILL\.md/);
  assert.match(javaDev.split('---')[1], /disallowedTools:/);
  assert.match(javaDev.split('---')[1], /- agent/);
  assert.match(javaDev.split('---')[1], /- workflow/);

  const commit = output.get('qwen/plugins/anton-toolkit/skills/commit/SKILL.md');
  assert.match(commit, /^description: .*Use when:/m);
  assert.doesNotMatch(commit, /^when_to_use:/m);
  const javaConventions = output.get('qwen/plugins/anton-toolkit/skills/java-conventions/SKILL.md');
  assert.match(javaConventions, /^user-invocable: false$/m);
  assert.match(javaConventions, /^paths:/m);
  assert.match(output.get('qwen/plugins/lichnost/skills/film/SKILL.md'), /disable-model-invocation: true/);
  assert.match(output.get('qwen/plugins/anton-toolkit/qwen-runtime.md'), /anton-toolkit:code-reviewer/);

  const youtube = JSON.parse(output.get('qwen/plugins/youtube-toolkit/qwen-extension.json')).mcpServers.youtube;
  assert.equal(youtube.command, 'cmd.exe');
  assert.deepEqual(youtube.args, ['/d', '/s', '/c', 'npx', '-y', 'youtube-data-mcp-server']);

  const toolkitManifest = JSON.parse(output.get('qwen/plugins/anton-toolkit/qwen-extension.json'));
  assert.equal(toolkitManifest.hooks, 'hooks/hooks.json');
  assert.equal(toolkitManifest.skills, './skills/');
  assert.equal(toolkitManifest.agents, './agents/');
  const hooks = JSON.parse(output.get('qwen/plugins/anton-toolkit/hooks/hooks.json')).hooks;
  assert.equal(hooks.PreToolUse[0].matcher, 'run_shell_command');
  assert.match(hooks.PostToolUse[0].matcher, /edit\|write_file/);
  assert.ok(hooks.Stop);
  assert.ok(hooks.SubagentStop);
  assert.doesNotMatch(JSON.stringify(hooks), /"Bash"|"PowerShell"|"if"/);
  assert.ok(!JSON.parse(output.get('qwen/plugins/lichnost/qwen-extension.json')).hooks);

  for (const [path, content] of output) {
    if (path.endsWith('.json')) JSON.parse(content);
    if (path.endsWith('SKILL.md') || path.includes('/agents/')) {
      assert.ok(content.length > 100);
      assert.doesNotMatch(content, /\$\{CLAUDE_(?:PLUGIN_ROOT|SKILL_DIR)\}/);
    }
  }
});

test('a source-only edit changes the Qwen package version; removed resources disappear; rebuild is idempotent', () => {
  const fixture = mkdtempSync(join(tmpdir(), 'anton-toolkit-qwen-build-'));
  try {
    for (const directory of ['plugins', 'adapters', '.claude-plugin']) {
      cpSync(join(repositoryRoot, directory), join(fixture, directory), { recursive: true });
    }
    const first = writeBuild(fixture);
    assert.ok(first.changed > 0);
    assert.deepEqual(writeBuild(fixture), { files: first.files, changed: 0, removed: 0 });
    const manifest = join(fixture, 'qwen/plugins/anton-toolkit/qwen-extension.json');
    const before = JSON.parse(readFileSync(manifest, 'utf8')).version;
    const source = join(fixture, 'plugins/anton-toolkit/skills/task-build/SKILL.md');
    writeFileSync(source, readFileSync(source, 'utf8') + '\nA new source requirement.\n');
    assert.throws(() => writeBuild(fixture, true), /need rebuilding/);
    writeBuild(fixture);
    assert.notEqual(JSON.parse(readFileSync(manifest, 'utf8')).version, before);
    const resource = join(fixture, 'plugins/anton-toolkit/references/compose.md');
    rmSync(resource);
    writeBuild(fixture);
    assert.equal(existsSync(join(fixture, 'qwen/plugins/anton-toolkit/references/compose.md')), false);
    assert.doesNotThrow(() => writeBuild(fixture, true));
  } finally {
    assert.ok(resolve(fixture).startsWith(resolve(tmpdir()) + sep));
    rmSync(fixture, { recursive: true, force: true });
  }
});
