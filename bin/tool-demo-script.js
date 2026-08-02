#!/usr/bin/env node
/**
 * tool-demo-script CLI
 *
 * Usage:
 *   tool-demo-script demo --repo ./my-cli --out demo.md
 *   tool-demo-script verify [options] <demo-file>
 */
const path = require('path');
const fs = require('fs');
const { generate, verify } = require('../src');

async function main() {
  const args = process.argv.slice(2);
  const [action, ...rest] = args;

  if (!action || action === '--help' || action === '-h') {
    console.log(`tool-demo-script — Generate and verify CLI demo scripts.

Usage:
  tool-demo-script <action> [options]
  tool-demo-script verify [options] <demo-file>

Actions:
  demo     Generate a demo script from a CLI repo
  verify   Verify demo commands against the repo

demo options:
  --repo <path>      Path to the CLI repo
  --out <file>       Write demo script to file
  --narration        Also print narration metadata

verify options:
  --repo <path>      Path to the CLI repo
  --allow-unsafe     Run commands outside the safe allowlist

Options may appear before or after the verify demo file.

Examples:
  tool-demo-script demo --repo ./my-cli --out demo.md
  tool-demo-script verify demo.md --repo ./my-cli
`);
    process.exit(0);
  }

  if (action === 'demo') {
    const parsed = parseArgs(rest, {
      values: ['--repo', '--out'],
      booleans: ['--narration'],
      positionals: 0,
    });
    const repoPath = parsed.values['--repo'];
    const outFile = parsed.values['--out'];
    const showNarration = parsed.booleans.has('--narration');

    if (!repoPath) {
      console.error('Error: --repo is required');
      process.exit(1);
    }
    requireReadableDirectory(repoPath, 'repository');

    const result = generate(repoPath);

    if (outFile) {
      fs.writeFileSync(outFile, result.scriptMarkdown, 'utf8');
      console.error(`Demo script → ${outFile}`);
    } else {
      console.log(result.scriptMarkdown);
    }

    if (showNarration) {
      console.log('\n--- Narration ---');
      console.log(JSON.stringify(result.narration, null, 2));
      console.log('\n--- Confidence ---');
      console.log(JSON.stringify(result.confidence, null, 2));
    }

    process.exit(0);
  }

  if (action === 'verify') {
    const parsed = parseArgs(rest, {
      values: ['--repo'],
      booleans: ['--allow-unsafe'],
      positionals: 1,
    });
    const [demoPath] = parsed.positionals;
    const repoPath = parsed.values['--repo'];
    const allowUnsafe = parsed.booleans.has('--allow-unsafe');

    if (!demoPath || !repoPath) {
      console.error('Error: both demo file and --repo are required');
      process.exit(1);
    }
    requireReadableFile(demoPath, 'demo file');
    requireReadableDirectory(repoPath, 'repository');

    const report = await verify(demoPath, repoPath, { allowUnsafe });
    console.log(`Verified: ${report.passed} passed, ${report.failed} failed, ${report.skipped} skipped`);
    for (const d of report.details) {
      const icon = d.status === 'passed' ? '✓' : d.status === 'failed' ? '✗' : '○';
      console.log(`${icon} ${d.command}`);
      if (d.output) console.log(`  → ${d.output}`);
      if (d.error) console.log(`  → ${d.error}`);
    }

    process.exit(report.failed > 0 ? 1 : 0);
  }

  console.error(`Unknown action: ${action}`);
  process.exit(1);
}

function parseArgs(args, grammar) {
  const values = {};
  const booleans = new Set();
  const positionals = [];

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (grammar.values.includes(arg)) {
      const operand = args[index + 1];
      if (!operand || operand.startsWith('-')) usageError(`${arg} requires a value`);
      values[arg] = operand;
      index += 1;
    } else if (grammar.booleans.includes(arg)) {
      booleans.add(arg);
    } else if (arg.startsWith('-')) {
      usageError(`unknown option: ${arg}`);
    } else {
      positionals.push(arg);
    }
  }

  if (positionals.length > grammar.positionals) {
    usageError(`unexpected argument: ${positionals[grammar.positionals]}`);
  }
  return { values, booleans, positionals };
}

function usageError(message) {
  console.error(`Error: ${message}\nTry 'tool-demo-script --help' for usage.`);
  process.exit(1);
}

function requireReadableFile(filePath, label) {
  requireReadable(filePath, label, (stat) => stat.isFile());
}

function requireReadableDirectory(filePath, label) {
  requireReadable(filePath, label, (stat) => stat.isDirectory());
}

function requireReadable(filePath, label, matchesType) {
  try {
    fs.accessSync(filePath, fs.constants.R_OK);
    if (!matchesType(fs.statSync(filePath))) throw new Error('wrong type');
  } catch {
    usageError(`${label} is not readable: ${filePath}`);
  }
}

main().catch((error) => usageError(error.message));
