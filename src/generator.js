/**
 * generator — create demo script markdown, narration, and confidence report
 */
const path = require('path');
const fs = require('fs');

function generateDemoScript(repoPath, entry, _options = {}) {
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
    lines.push(`npm install ${entry.name}`);
  }
  lines.push('```');
  lines.push('');

  if (entry.commands.length > 0) {
    lines.push('## 2. Check version');
    lines.push('');
    lines.push('```bash');
    const firstBin = entry.binEntry || entry.entryPoint || 'index.js';
    lines.push(`node ${firstBin} --version`);
    lines.push('# => ' + entry.version);
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
  const exampleDirs = ['examples', 'demo', 'demos', 'samples'];
  for (const dir of exampleDirs) {
    const exampleDir = path.join(repoPath, dir);
    if (fs.existsSync(exampleDir) && fs.statSync(exampleDir).isDirectory()) {
      const files = fs.readdirSync(exampleDir);
      for (const file of files) {
        const examplePath = path.join(exampleDir, file);
        if (file.endsWith('.sh') || file.endsWith('.md')) {
          lines.push(`## Demo: ${path.basename(file, path.extname(file))}`);
          lines.push('');
          lines.push('```bash');
          const content = fs.readFileSync(examplePath, 'utf8').trim();
          lines.push(content);
          lines.push('```');
          lines.push('');
        }
      }
    }
  }

  return lines.join('\n');
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
  else { failed++; checks.push({ item: 'CI configuration', status: 'fail', detail: 'none detected' }); }

  if (entry.hasLicense) { passed++; checks.push({ item: 'LICENSE file', status: 'pass' }); }
  else { failed++; checks.push({ item: 'LICENSE file', status: 'fail', detail: 'missing' }); }

  if (entry.hasExamples) { passed++; checks.push({ item: 'examples directory', status: 'pass' }); }
  else { failed++; checks.push({ item: 'examples directory', status: 'fail', detail: 'none found' }); }

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
