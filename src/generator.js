/**
 * generator — create demo script markdown, narration, and confidence report
 */
const path = require('path');
const fs = require('fs');
const { spawnSync } = require('child_process');

function selectVersionStep(repoPath, entry) {
  const versionEntry = entry.binEntry || entry.entryPoint || entry.commands[0]?.entry;
  if (!versionEntry || !entry.version) return null;

  const absoluteEntry = path.resolve(repoPath, versionEntry);
  const relativeEntry = path.relative(repoPath, absoluteEntry);
  if (relativeEntry.startsWith('..') || path.isAbsolute(relativeEntry) || !fs.existsSync(absoluteEntry)) {
    return null;
  }

  const probe = spawnSync(process.execPath, [absoluteEntry, '--version'], {
    cwd: repoPath,
    encoding: 'utf8',
    timeout: 2000,
    maxBuffer: 64 * 1024,
  });
  const outputLines = `${probe.stdout || ''}${probe.stderr || ''}`
    .split(/\r?\n/)
    .map((line) => line.trim());
  if (probe.error || probe.status !== 0 || !outputLines.includes(entry.version)) return null;

  return {
    command: `node ${quoteShellArgument(versionEntry)} --version`,
    expectedOutput: entry.version,
  };
}

function generateDemoScript(repoPath, entry, options = {}) {
  const lines = [];
  lines.push(`# Demo: ${entry.name} v${entry.version}`);
  lines.push('');
  lines.push(`> ${entry.description || 'A CLI tool built with Node.js'}`);
  lines.push('');

  // Demo sections
  lines.push('## 1. Install');
  lines.push('');
  lines.push('```bash');
  if (entry.hasPackageJson) {
    lines.push('npm install .');
  }
  lines.push('```');
  lines.push('');

  const versionStep = options.probeVersion ? selectVersionStep(repoPath, entry) : null;
  if (versionStep) {
    lines.push('## 2. Check version');
    lines.push('');
    lines.push('```bash');
    lines.push(versionStep.command);
    lines.push('# => ' + versionStep.expectedOutput);
    lines.push('```');
    lines.push('');
  }

  if (entry.startCommand) {
    lines.push('## 3. Run the tool');
    lines.push('');
    lines.push('```bash');
    lines.push(entry.startCommand);
    lines.push('```');
    lines.push('');
  }

  if (entry.testCommand) {
    lines.push('## 4. Run tests');
    lines.push('');
    lines.push('```bash');
    lines.push(entry.testCommand);
    lines.push('```');
    lines.push('');
  }

  // Extract examples
  const exampleDirs = ['examples', 'example', 'demo', 'demos', 'samples'];
  for (const dir of exampleDirs) {
    const exampleDir = path.join(repoPath, dir);
    if (fs.existsSync(exampleDir) && fs.statSync(exampleDir).isDirectory()) {
      const files = fs.readdirSync(exampleDir);
      for (const file of files) {
        const examplePath = path.join(exampleDir, file);
        if (file.endsWith('.sh') || file.endsWith('.md')) {
          lines.push(`## Demo: ${path.basename(file, path.extname(file))}`);
          lines.push('');
          const content = fs.readFileSync(examplePath, 'utf8').trim();
          if (file.endsWith('.md')) {
            lines.push(content);
          } else {
            lines.push('```bash');
            lines.push(content);
            lines.push('```');
          }
          lines.push('');
        }
      }
    }
  }

  return lines.join('\n');
}

function quoteShellArgument(value) {
  const argument = String(value);
  if (/^[A-Za-z0-9_./:@%+=,-]+$/.test(argument)) return argument;
  return `'${argument.replace(/'/g, `'"'"'`)}'`;
}

function generateNarration(demoScript) {
  return {
    title: extractTitle(demoScript),
    sections: countSections(demoScript),
    estimatedDuration: estimateDuration(demoScript),
    keyCommands: extractCommands(demoScript),
  };
}

function generateConfidenceReport(repoPath, entry, demoScript) {
  const checks = [];
  let passed = 0;
  let failed = 0;

  // Check each demo component is verifiable
  if (entry.hasPackageJson) { passed++; checks.push({ item: 'package.json', status: 'pass' }); }
  else { failed++; checks.push({ item: 'package.json', status: 'fail', detail: 'missing' }); }

  if (entry.hasReadme) { passed++; checks.push({ item: 'README', status: 'pass' }); }
  else { failed++; checks.push({ item: 'README', status: 'fail', detail: 'missing' }); }

  if (entry.hasCI) { passed++; checks.push({ item: 'CI configuration', status: 'pass' }); }
  else { failed++; checks.push({ item: 'CI configuration', status: 'fail', detail: entry.ciEvidence?.detail || 'none detected' }); }

  if (entry.hasLicense) { passed++; checks.push({ item: 'LICENSE file', status: 'pass' }); }
  else { failed++; checks.push({ item: 'LICENSE file', status: 'fail', detail: 'missing' }); }

  if (entry.hasExamples) { passed++; checks.push({ item: 'examples directory', status: 'pass' }); }
  else { failed++; checks.push({ item: 'examples directory', status: 'fail', detail: entry.exampleEvidence?.detail || 'none found' }); }

  if (entry.testCommand) { passed++; checks.push({ item: 'test script', status: 'pass' }); }
  else { failed++; checks.push({ item: 'test script', status: 'fail', detail: 'no test in package.json' }); }

  return {
    score: Math.round((passed / (passed + failed)) * 100),
    passed,
    failed,
    total: passed + failed,
    checks,
  };
}

function extractTitle(demo) {
  const match = demo.match(/^# Demo: (.+)$/m);
  return match ? match[1] : 'Demo';
}

function countSections(demo) {
  return (demo.match(/^## /gm) || []).length;
}

function estimateDuration(demo) {
  const sections = countSections(demo);
  // Estimate ~30 seconds per section
  return `${sections * 30} seconds`;
}

function extractCommands(demo) {
  const commands = [];
  const regex = /```bash\n([\s\S]*?)```/g;
  let match;
  while ((match = regex.exec(demo)) !== null) {
    const lines = match[1].split('\n').filter(l => l.trim() && !l.startsWith('#'));
    commands.push(...lines);
  }
  return commands;
}

module.exports = { generateDemoScript, generateNarration, generateConfidenceReport };
