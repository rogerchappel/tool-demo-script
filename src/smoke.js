/**
 * smoke — verify demo commands still work against the repo
 */
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

// Commands that are safe to run without side effects
const SAFE_COMMANDS = ['--version', '-V', '--help', '-h', 'version', 'help', 'info', 'list', 'ls'];

async function runSmoke(repoPath, demoContent, options = {}) {
  const results = { passed: 0, failed: 0, skipped: 0, details: [] };
  const commands = extractBashCommands(demoContent);

  for (const raw of commands) {
    const cmd = raw.replace(/^node\s+|^\.\//, '').trim();
    const isSafe = SAFE_COMMANDS.some(s => cmd.includes(s));

    if (!isSafe && !options.allowUnsafe) {
      results.skipped++;
      results.details.push({ command: raw, status: 'skipped', reason: 'not in safe command list' });
      continue;
    }

    try {
      const fullCmd = raw.startsWith('node ') ? raw : `node ${raw}`;
      const output = execSync(fullCmd, { cwd: repoPath, encoding: 'utf8', timeout: 5000 });
      results.passed++;
      results.details.push({ command: raw, status: 'passed', output: output.trim().slice(0, 200) });
    } catch (err) {
      results.failed++;
      results.details.push({ command: raw, status: 'failed', error: err.message.slice(0, 200) });
    }
  }

  return results;
}

function extractBashCommands(demoContent) {
  const commands = [];
  const regex = /```bash\n([\s\S]*?)```/g;
  let match;
  while ((match = regex.exec(demoContent)) !== null) {
    const lines = match[1].split('\n')
      .map(l => l.trim())
      .filter(l => l && !l.startsWith('#') && !l.startsWith('npm install'));
    commands.push(...lines);
  }
  return commands;
}

module.exports = { runSmoke };
