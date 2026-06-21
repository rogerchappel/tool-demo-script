#!/usr/bin/env node
/**
 * tool-demo-script CLI
 *
 * Usage:
 *   tool-demo-script demo --repo ./my-cli --out demo.md
 *   tool-demo-script verify demo.md --repo ./my-cli
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

Examples:
  tool-demo-script demo --repo ./my-cli --out demo.md
  tool-demo-script verify --repo ./my-cli demo.md
`);
    process.exit(0);
  }

  if (action === 'demo') {
    const repoPath = extractFlag(rest, '--repo');
    const outFile = extractFlag(rest, '--out');
    const showNarration = rest.includes('--narration');

    if (!repoPath) {
      console.error('Error: --repo is required');
      process.exit(1);
    }

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
    const demoPath = rest[0];
    const repoPath = extractFlag(rest, '--repo');
    const allowUnsafe = rest.includes('--allow-unsafe');

    if (!demoPath || !repoPath) {
      console.error('Error: both demo file and --repo are required');
      process.exit(1);
    }

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

function extractFlag(args, flag) {
  const idx = args.indexOf(flag);
  if (idx === -1 || idx + 1 >= args.length) return null;
  return args[idx + 1];
}

main();
