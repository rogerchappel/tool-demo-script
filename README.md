# tool-demo-script

Create runnable demo scripts and narration from a CLI repo, then verify the commands still work.

## Quickstart

```bash
npm install -g @rogerchappel/tool-demo-script

# Generate a demo script for a CLI repo
tool-demo-script demo ./my-cli --out demo.md

# Verify demo commands still work
tool-demo-script verify ./demo.md --repo ./my-cli

# Library API
const { generate, verify } = require('@rogerchappel/tool-demo-script');
const demo = generate('./my-cli');
console.log(demo.scriptMarkdown);
```

## What It Does

- Detects the CLI entrypoint and available commands from `package.json` and scripts
- Generates a structured demo script in Markdown with install, version, and usage sections
- Extracts example scripts from `examples/` directories
- Produces narration metadata (title, sections, duration, key commands)
- Generates a confidence report scoring package health (README, LICENSE, CI, tests, examples)
- Verifies demo commands still execute correctly via smoke testing

## CLI Usage

```
Usage: tool-demo-script <action> [options]

Actions:
  demo     Generate a demo script from a CLI repo
  verify   Verify demo commands against the repo

demo options:
  --repo <path>      Path to the CLI repo
  --out <file>       Write demo script to file (default: stdout)
  --narration        Also print narration metadata

verify options:
  --repo <path>      Path to the CLI repo
  --allow-unsafe     Run commands outside the safe allowlist

Examples:
  tool-demo-script demo --repo ./my-cli --out demo.md
  tool-demo-script verify --repo ./my-cli demo.md
```

## Confidence Report

| Check | What it verifies |
|-------|-----------------|
| package.json | Valid metadata and scripts |
| README | Usable documentation |
| LICENSE | Legal clarity for users |
| CI | Automated testing pipeline |
| examples | Working demos for users |
| test script | Testable codebase |

## Limitations

- Node.js CLI repos only (package.json based)
- Verification runs commands locally; use `--allow-unsafe` with caution
- Does not modify the target repo

## Verify

```bash
npm test
npm run check
npm run smoke
npm pack --dry-run
```

## Safety Notes

- Demo detection is read-only
- Verification runs commands in the repo directory with a 5s timeout
- npm install commands are excluded from verification
- Safe command allowlist: `--version`, `-V`, `--help`, `-h`, `version`, `help`, `info`, `list`, `ls`
