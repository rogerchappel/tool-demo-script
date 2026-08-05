/**
 * smoke — verify demo commands still work against the repo
 */
const path = require('path');
const fs = require('fs');
const { execFileSync } = require('child_process');

// Commands that are safe to run without side effects
const SAFE_COMMANDS = ['--version', '-V', '--help', '-h', 'version', 'help', 'info', 'list', 'ls'];

async function runSmoke(repoPath, demoContent, options = {}) {
  const results = { passed: 0, failed: 0, skipped: 0, details: [] };
  const commands = extractBashCommands(demoContent);

  for (const raw of commands) {
    let tokens;
    try {
      tokens = parseCommandLine(raw);
    } catch (err) {
      results.skipped++;
      results.details.push({ command: raw, status: 'skipped', reason: err.message });
      continue;
    }
    const hasShellSyntax = /[;&|`$<>\n\r]/.test(raw);
    const isSafe = !hasShellSyntax && tokens.some(token => SAFE_COMMANDS.includes(token));

    if (!isSafe && !options.allowUnsafe) {
      results.skipped++;
      results.details.push({ command: raw, status: 'skipped', reason: 'not in safe command list' });
      continue;
    }

    try {
      const command = resolveCommand(repoPath, raw);
      const output = execFileSync(command.file, command.args, {
        cwd: repoPath,
        encoding: 'utf8',
        timeout: 5000,
      });
      results.passed++;
      results.details.push({ command: raw, status: 'passed', output: output.trim().slice(0, 200) });
    } catch (err) {
      results.failed++;
      results.details.push({ command: raw, status: 'failed', error: err.message.slice(0, 200) });
    }
  }

  return results;
}

function resolveCommand(repoPath, raw) {
  const [executable, ...args] = parseCommandLine(raw);

  if (executable === 'node') {
    return { file: process.execPath, args };
  }

  const packagePath = path.join(repoPath, 'package.json');
  if (fs.existsSync(packagePath)) {
    const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    const bins = typeof pkg.bin === 'string'
      ? { [pkg.name]: pkg.bin }
      : (pkg.bin || {});
    if (Object.prototype.hasOwnProperty.call(bins, executable)) {
      return { file: process.execPath, args: [path.resolve(repoPath, bins[executable]), ...args] };
    }
  }

  if (executable.startsWith('./')) {
    return { file: process.execPath, args: [path.resolve(repoPath, executable), ...args] };
  }

  throw new Error(`Command is not a direct node invocation or a declared package bin: ${executable}`);
}

function parseCommandLine(raw) {
  const tokens = [];
  let token = '';
  let quote = null;
  let started = false;

  for (let i = 0; i < raw.length; i++) {
    const char = raw[i];
    if (quote) {
      if (char === quote) {
        quote = null;
      } else if (char === '\\' && quote === '"') {
        if (i + 1 >= raw.length) throw new Error('trailing escape in command');
        token += raw[++i];
      } else {
        token += char;
      }
      started = true;
    } else if (char === "'" || char === '"') {
      quote = char;
      started = true;
    } else if (/\s/.test(char)) {
      if (started) {
        tokens.push(token);
        token = '';
        started = false;
      }
    } else if (char === '\\') {
      if (i + 1 >= raw.length) throw new Error('trailing escape in command');
      token += raw[++i];
      started = true;
    } else {
      token += char;
      started = true;
    }
  }

  if (quote) throw new Error('unterminated quote in command');
  if (started) tokens.push(token);
  if (tokens.length === 0) throw new Error('empty command');
  return tokens;
}

function extractBashCommands(demoContent) {
  const commands = [];
  const regex = /```bash\r?\n([\s\S]*?)```/g;
  let match;
  while ((match = regex.exec(demoContent)) !== null) {
    const lines = match[1].split(/\r?\n/)
      .map(l => l.trim())
      .filter(l => l && !l.startsWith('#') && !l.startsWith('npm install'));
    commands.push(...lines);
  }
  return commands;
}

module.exports = { runSmoke };
