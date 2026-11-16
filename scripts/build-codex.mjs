import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse, stringify } from 'yaml';

export const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const textExtensions = new Set(['.md', '.json', '.js', '.mjs', '.py', '.ps1', '.sh', '.txt', '.yaml', '.yml']);
const readText = path => readFileSync(path, 'utf8').replace(/^\uFEFF/, '').replaceAll('\r\n', '\n');
const json = value => JSON.stringify(value, null, 2) + '\n';

function files(directory) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    if (entry.isSymbolicLink()) throw new Error(`Unexpected symlink: ${join(directory, entry.name)}`);
    const path = join(directory, entry.name);
    return entry.isDirectory() ? files(path) : [path];
  }).sort();
}

export function frontmatter(text, path) {
  const match = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/.exec(text);
  if (!match) throw new Error(`Missing frontmatter: ${path}`);
  const data = parse(match[1]);
  if (typeof data.name !== 'string' || typeof data.description !== 'string') {
    throw new Error(`Missing skill name/description: ${path}`);
  }
  return { data, body: match[2].trimStart() };
}

function portableText(text) {
  return text.replaceAll('${CLAUDE_PLUGIN_ROOT}', 'PLUGIN_ROOT')
    .replaceAll('${CLAUDE_SKILL_DIR}', 'SKILL_DIR');
}

export function convertSkill(text, sourcePath, plugin, runtime, model, isAgent) {
  const { data, body } = frontmatter(text, sourcePath);
  const header = { name: data.name, description: data.description.trim() };
  if (data['disable-model-invocation'] === true) header['disable-model-invocation'] = true;
  if (data['user-invocable'] === false) header['user-invocable'] = false;
  let launch = '';
  if (isAgent) {
    launch += '\n## Role launch requirements\n\n';
    launch += model
      ? `Dispatch ${plugin}:${data.name} with model="${model.model}", reasoning_effort="${model.reasoning_effort}", fork_turns="none".\n`
      : 'Inherit the main session model and reasoning effort unless the user specifies otherwise.\n';
    if (data.skills?.length) launch += `Before working, read these skills explicitly: ${data.skills.map(skill => `PLUGIN_ROOT/skills/${skill}/SKILL.md`).join(', ')}.\n`;
    if (data.tools) launch += `Source role tool allowlist (map to available native equivalents): ${JSON.stringify(data.tools)}.\n`;
    if (data.disallowedTools) launch += `Source role prohibited tools/capabilities: ${JSON.stringify(data.disallowedTools)}. Preserve these restrictions.\n`;
  }
  return `---\n${stringify(header, { lineWidth: 0 }).trimEnd()}\n---\n\n` +
    `<!-- Generated from ${sourcePath}; edit that source, then run npm run build. -->\n\n` +
    `## Codex runtime\n\nRead PLUGIN_ROOT/codex-runtime.md before using this procedure. ${runtime}\n` +
    launch + '\n' + portableText(body).trimEnd() + '\n';
}

export function buildFiles(root) {
  const catalog = JSON.parse(readText(join(root, '.claude-plugin/marketplace.json')));
  const models = JSON.parse(readText(join(root, 'adapters/codex/models.json')));
  const template = readText(join(root, 'adapters/codex/runtime.md'));
  const names = catalog.plugins.map(plugin => plugin.name);
  if (new Set(names).size !== names.length) throw new Error('Duplicate plugin names');
  const output = new Map();
  const knownAgents = new Set();
  const generatedCatalog = { name: catalog.name, interface: { displayName: 'Антон — Claude и Codex' }, plugins: [] };
  for (const plugin of catalog.plugins) {
    if (!/^[a-z0-9-]+$/.test(plugin.name) || plugin.source !== `./plugins/${plugin.name}`) {
      throw new Error(`Expected repository-local plugin: ${plugin.name}`);
    }
    const sourceRoot = join(root, 'plugins', plugin.name);
    const manifest = JSON.parse(readText(join(sourceRoot, '.claude-plugin/plugin.json')));
    const packageFiles = new Map();
    const table = '| Role | model | reasoning_effort |\n|---|---|---|\n' + Object.entries(models)
      .map(([role, settings]) => `| ${role} | ${settings.model} | ${settings.reasoning_effort} |`).join('\n');
    packageFiles.set('codex-runtime.md', template.replace('{{MODEL_TABLE}}', table));
    packageFiles.set('codex-models.json', json(models));
    for (const sourceFile of files(sourceRoot)) {
      const path = relative(sourceRoot, sourceFile).split(sep).join('/');
      if (path.startsWith('.claude-plugin/')) continue;
      const isAgent = /^agents\/[^/]+\.md$/.test(path);
      const isSkill = /^skills\/[^/]+\/SKILL\.md$/.test(path);
      if (path.startsWith('agents/') && !isAgent) throw new Error(`Unexpected agent resource: ${path}`);
      if (isAgent || isSkill) {
        const text = readText(sourceFile);
        const { data } = frontmatter(text, sourceFile);
        const target = isAgent ? `skills/${data.name}/SKILL.md` : path;
        if (packageFiles.has(target)) throw new Error(`Agent/skill collision: ${plugin.name}/${target}`);
        if (isAgent) knownAgents.add(`${plugin.name}:${data.name}`);
        const converted = convertSkill(text, `plugins/${plugin.name}/${path}`, plugin.name,
          'Shared source lives in the anton-toolkit Git repository; installed packages are generated.',
          models[`${plugin.name}:${data.name}`], isAgent);
        packageFiles.set(target, converted);
      } else {
        const extension = /\.[^.]+$/.exec(path)?.[0];
        packageFiles.set(path, textExtensions.has(extension) ? portableText(readText(sourceFile)) : readFileSync(sourceFile));
      }
    }
    const overlayRoot = join(root, 'adapters/codex/plugins', plugin.name);
    for (const path of files(overlayRoot)) {
      const target = relative(overlayRoot, path).split(sep).join('/');
      packageFiles.set(target, readText(path));
    }
    const digest = createHash('sha256');
    for (const [path, content] of [...packageFiles].sort(([a], [b]) => a.localeCompare(b, 'en'))) {
      digest.update(path).update('\0').update(content).update('\0');
    }
    const generatedManifest = {
      name: manifest.name, version: `${manifest.version}-codex.h${digest.digest('hex').slice(0, 12)}`,
      description: manifest.description, author: manifest.author, skills: './skills/',
      ...(packageFiles.has('hooks/hooks.json') ? { hooks: './hooks/hooks.json' } : {})
    };
    packageFiles.set('.codex-plugin/plugin.json', json(generatedManifest));
    for (const [path, content] of packageFiles) output.set(`codex/plugins/${plugin.name}/${path}`, content);
    generatedCatalog.plugins.push({ name: plugin.name, source: { source: 'local', path: `./codex/plugins/${plugin.name}` }, policy: { installation: 'AVAILABLE', authentication: 'ON_INSTALL' }, category: 'Productivity' });
  }
  for (const [role, settings] of Object.entries(models)) {
    if (!knownAgents.has(role)) throw new Error(`Model override points to missing agent: ${role}`);
    if (!['gpt-6.1-sol', 'gpt-6-astra'].includes(settings.model) || !['medium', 'high', 'xhigh'].includes(settings.reasoning_effort)) {
      throw new Error(`Invalid model allocation: ${role}`);
    }
  }
  output.set('.agents/plugins/marketplace.json', json(generatedCatalog));
  return output;
}

export function writeBuild(root, check = false) {
  const output = buildFiles(root);
  const generatedRoot = resolve(root, 'codex/plugins');
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
