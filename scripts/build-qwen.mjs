import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { stringify } from 'yaml';
import { frontmatter, repositoryRoot } from './build-codex.mjs';

const textExtensions = new Set(['.md', '.json', '.js', '.mjs', '.py', '.ps1', '.sh', '.txt', '.yaml', '.yml']);
const readText = path => readFileSync(path, 'utf8').replace(/^\uFEFF/, '').replaceAll('\r\n', '\n');
const json = value => JSON.stringify(value, null, 2) + '\n';

// Claude Code tool names -> native Qwen Code tool ids.
const toolNames = {
  Read: 'read_file',
  ReadManyFiles: 'read_many_files',
  Write: 'write_file',
  Edit: 'edit',
  MultiEdit: 'edit',
  NotebookEdit: 'notebook_edit',
  NotebookRead: 'notebook_read',
  Glob: 'glob',
  Grep: 'grep_search',
  Bash: 'run_shell_command',
  PowerShell: 'run_shell_command',
  WebFetch: 'web_fetch',
  WebSearch: 'web_search',
  Task: 'agent',
  Agent: 'agent',
  Workflow: 'workflow'
};

function files(directory) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    if (entry.isSymbolicLink()) throw new Error(`Unexpected symlink: ${join(directory, entry.name)}`);
    const path = join(directory, entry.name);
    return entry.isDirectory() ? files(path) : [path];
  }).sort();
}

function portableText(text) {
  return text.replaceAll('${CLAUDE_PLUGIN_ROOT}', 'PLUGIN_ROOT')
    .replaceAll('${CLAUDE_SKILL_DIR}', 'SKILL_DIR');
}

function mapTools(value, sourcePath) {
  const names = Array.isArray(value) ? value : String(value).split(',').map(name => name.trim());
  return names.filter(Boolean).map(name => {
    const mapped = toolNames[name];
    if (!mapped) throw new Error(`Unknown Claude tool "${name}" in ${sourcePath}; extend the Qwen tool map`);
    return mapped;
  });
}

export function convertDocument(text, sourcePath, isAgent) {
  const { data, body } = frontmatter(text, sourcePath);
  const header = { name: data.name, description: data.description.trim() };
  let launch = '';
  if (isAgent) {
    if (data.color) header.color = data.color;
    if (data.tools) header.tools = mapTools(data.tools, sourcePath);
    if (data.disallowedTools) header.disallowedTools = mapTools(data.disallowedTools, sourcePath);
    if (data.skills?.length) {
      launch += `Before working, read these skills explicitly: ${data.skills.map(skill => `PLUGIN_ROOT/skills/${skill}/SKILL.md`).join(', ')}.\n`;
    }
    launch += 'Return one complete, self-contained result to the caller.\n';
  } else {
    // Qwen has no when_to_use field; keep the triggers in the description the model actually reads.
    if (data.when_to_use) header.description += ` Use when: ${String(data.when_to_use).trim()}`;
    if (data.paths) header.paths = data.paths;
    if (data['user-invocable'] === false) header['user-invocable'] = false;
    if (data['disable-model-invocation'] === true) header['disable-model-invocation'] = true;
    if (data['allowed-tools']) throw new Error(`allowed-tools needs an explicit Qwen adaptation: ${sourcePath}`);
  }
  return `---\n${stringify(header, { lineWidth: 0 }).trimEnd()}\n---\n\n` +
    `<!-- Generated from ${sourcePath}; edit that source, then run npm run build. -->\n\n` +
    '## Qwen runtime\n\nRead PLUGIN_ROOT/qwen-runtime.md before using this procedure.\n\n' +
    launch + '\n' + portableText(body).trimEnd() + '\n';
}

export function buildFiles(root) {
  const catalog = JSON.parse(readText(join(root, '.claude-plugin/marketplace.json')));
  const template = readText(join(root, 'adapters/qwen/runtime.md'));
  const names = catalog.plugins.map(plugin => plugin.name);
  if (new Set(names).size !== names.length) throw new Error('Duplicate plugin names');
  const output = new Map();
  const generatedCatalog = { version: '2', plugins: [] };
  for (const plugin of catalog.plugins) {
    if (!/^[a-z0-9-]+$/.test(plugin.name) || plugin.source !== `./plugins/${plugin.name}`) {
      throw new Error(`Expected repository-local plugin: ${plugin.name}`);
    }
    const sourceRoot = join(root, 'plugins', plugin.name);
    const manifest = JSON.parse(readText(join(sourceRoot, '.claude-plugin/plugin.json')));
    const packageFiles = new Map([['qwen-runtime.md', template]]);
    for (const sourceFile of files(sourceRoot)) {
      const path = relative(sourceRoot, sourceFile).split(sep).join('/');
      if (path.startsWith('.claude-plugin/') || path === '.mcp.json') continue;
      const isAgent = /^agents\/[^/]+\.md$/.test(path);
      const isSkill = /^skills\/[^/]+\/SKILL\.md$/.test(path);
      if (path.startsWith('agents/') && !isAgent) throw new Error(`Unexpected agent resource: ${path}`);
      if (isAgent || isSkill) {
        packageFiles.set(path, convertDocument(readText(sourceFile), `plugins/${plugin.name}/${path}`, isAgent));
      } else {
        const extension = /\.[^.]+$/.exec(path)?.[0];
        packageFiles.set(path, textExtensions.has(extension) ? portableText(readText(sourceFile)) : readFileSync(sourceFile));
      }
    }
    const overlayRoot = join(root, 'adapters/qwen/plugins', plugin.name);
    for (const path of files(overlayRoot)) {
      const target = relative(overlayRoot, path).split(sep).join('/');
      packageFiles.set(target, readText(path));
    }
    const mcpPath = join(sourceRoot, '.mcp.json');
    const mcpServers = existsSync(mcpPath) ? JSON.parse(readText(mcpPath)).mcpServers : undefined;
    for (const server of Object.values(mcpServers || {})) {
      if (server.command === 'npx') {
        server.command = 'cmd.exe';
        server.args = ['/d', '/s', '/c', 'npx', ...(server.args || [])];
      }
    }
    const digest = createHash('sha256');
    for (const [path, content] of [...packageFiles].sort(([a], [b]) => a.localeCompare(b, 'en'))) {
      digest.update(path).update('\0').update(content).update('\0');
    }
    if (mcpServers) digest.update('mcpServers\0').update(json(mcpServers)).update('\0');
    const generatedManifest = {
      name: manifest.name,
      version: `${manifest.version}-qwen.h${digest.digest('hex').slice(0, 12)}`,
      description: manifest.description,
      author: manifest.author,
      skills: './skills/',
      ...([...packageFiles.keys()].some(path => path.startsWith('agents/')) ? { agents: './agents/' } : {}),
      ...(mcpServers ? { mcpServers } : {}),
      ...(packageFiles.has('hooks/hooks.json') ? { hooks: 'hooks/hooks.json' } : {}),
    };
    packageFiles.set('qwen-extension.json', json(generatedManifest));
    for (const [path, content] of packageFiles) output.set(`qwen/plugins/${plugin.name}/${path}`, content);
    generatedCatalog.plugins.push({ id: plugin.name, displayName: manifest.description, source: `./plugins/${plugin.name}` });
  }
  output.set('qwen/marketplace.json', json(generatedCatalog));
  return output;
}

export function writeBuild(root, check = false) {
  const output = buildFiles(root);
  const generatedRoot = resolve(root, 'qwen/plugins');
  const stale = files(generatedRoot).map(path => relative(root, path).split(sep).join('/')).filter(path => !output.has(path));
  const changed = [...output].filter(([path, content]) => !existsSync(join(root, path)) ||
    !readFileSync(join(root, path)).equals(Buffer.from(content))).map(([path]) => path);
  if (check && (changed.length || stale.length)) throw new Error(`Generated files need rebuilding:\n${[...changed, ...stale].join('\n')}`);
  if (!check) {
    for (const path of stale) {
      const target = resolve(root, path);
      if (!target.startsWith(generatedRoot + sep)) throw new Error(`Unsafe generated path: ${path}`);
      rmSync(target);
    }
    for (const path of changed) {
      const target = join(root, path);
      mkdirSync(dirname(target), { recursive: true });
      writeFileSync(target, output.get(path));
    }
  }
  return { files: output.size, changed: changed.length, removed: stale.length };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { console.log(JSON.stringify(writeBuild(repositoryRoot, process.argv.includes('--check')))); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
