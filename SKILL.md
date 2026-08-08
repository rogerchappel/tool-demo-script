# SKILL: tool-demo-script

## When to Use

Use this skill when:
- You need to generate runnable demo scripts for a CLI tool
- You want verified demos for READMEs, videos, or documentation
- You need to check that existing demo commands still work
- You are preparing launch material for an agentic tool

## Required Tools/Inputs

- Node.js 18+
- A local CLI repo with package.json

## What It Does

1. Detects CLI entrypoint, binary commands, and package scripts via `detectEntryPoint()`
2. Generates a structured demo Markdown with a local-source `npm install .`
   instruction plus version, usage, test, and example sections. It does not infer
   npm registry publication from the presence of `package.json`.
   (`.md` examples retain their Markdown and fenced commands; `.sh` examples are
   placed in a shell fence)
3. Produces narration metadata (title, sections count, estimated duration, key commands)
4. Generates a confidence report scoring 6 dimensions: package.json, README, LICENSE, CI, examples, tests
5. Optional `verify` runs safe commands with a 5s timeout and reports
   pass/fail/skip. A following `# => expected output` comment must match an exact
   output line; empty or mismatched output fails even when the command exits 0.

## Side-Effect Boundaries

- Detection is read-only on the target repo
- Verification **executes commands** in the repo directory — only runs safe commands by default
- Verification resolves direct `node <entry>` commands and package-bin names from
  the target repo's `package.json`; it does not search globally installed commands
- Never modifies repo files or runs `npm install` during verification
- Smoke commands timeout after 5 seconds

## Approval Requirements

- `demo` action: no approval needed, purely generates Markdown
- `verify` action with `--allow-unsafe`: require user approval before proceeding

## Examples

### Generate demo

```bash
tool-demo-script demo --repo ./my-cli-tool --out docs/demo.md
```

### Verify demo

```bash
tool-demo-script verify --repo ./my-cli-tool docs/demo.md
```

### Library usage

```js
const { generate, verify } = require('@rogerchappel/tool-demo-script');

// Generate
const demo = generate('./my-cli');
console.log(demo.scriptMarkdown); // Markdown demo script
console.log(demo.confidence);     // { score, passed, failed, checks }

// Verify
const report = await verify('demo.md', './my-cli');
console.log(report.passed + ' / ' + (report.passed + report.failed));
```

## Verification / Safety Workflow

1. Run `demo` to generate the script
2. Review the generated Markdown
3. Run `verify` to check commands
4. If verification fails, review which commands failed and fix the demo or the tool
5. Only use `--allow-unsafe` when the demo command is explicitly reviewed and safe

## Output Schema

Confidence report:
```json
{
  "score": 100,
  "passed": 6,
  "failed": 0,
  "total": 6,
  "checks": [
    { "item": "package.json", "status": "pass" },
    { "item": "README", "status": "pass" }
  ]
}
```

Smoke verification:
```json
{
  "passed": 2,
  "failed": 0,
  "skipped": 1,
  "details": [
    { "command": "node index.js --version", "status": "passed", "output": "0.1.0" }
  ]
}
```
