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
    const cmd = raw.replace(/^node\s+|^\.\//, '').trim();
    const tokens = cmd.split(/\s+/);
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
  const [executable, ...args] = raw.trim().split(/\s+/);

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
