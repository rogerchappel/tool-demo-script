# tool-demo-script

Create runnable demo scripts and narration from a CLI repo, then verify the commands still work.

## Quickstart

```bash
# The package is not currently published to npm; install it from the source repo.
git clone https://github.com/rogerchappel/tool-demo-script.git
npm install -g ./tool-demo-script

# Generate a demo script for a CLI repo
tool-demo-script demo --repo ./my-cli --out demo.md

# Verify demo commands still work
tool-demo-script verify ./demo.md --repo ./my-cli

# Library API
const { generate, verify } = require('./tool-demo-script');
const demo = generate('./my-cli');
console.log(demo.scriptMarkdown);
```

Run the checked-in fixture demo:

```bash
bash demo/run-fixture-demo.sh
```

Generate a reviewer-friendly promo packet with demo Markdown, narration,
confidence data, and verification output:

```bash
bash demo/promo-review-packet.sh
```

## What It Does

- Detects the CLI entrypoint and available commands from `package.json` and scripts
- Generates a structured demo script in Markdown with install, version, and usage sections
- Extracts examples from `examples/`, `demo/`, `demos/`, and `samples/`
  directories. Markdown examples are incorporated as Markdown so their prose and
  existing shell fences remain intact; `.sh` examples are wrapped in a shell
  fence.
- Produces narration metadata (title, sections, duration, key commands)
- Generates a confidence report scoring package health (README, LICENSE, CI, tests, examples)
- Verifies demo commands still execute correctly via smoke testing

Verification recognizes `bash` fenced code blocks in Markdown files that use
either LF (Unix) or CRLF (Windows) line endings.

## CLI Usage

```
Usage: tool-demo-script <action> [options]
       tool-demo-script verify [options] <demo-file>

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

Options may appear before or after the verify demo file. Each action rejects
unknown options and extra positional arguments.

Examples:
  tool-demo-script demo --repo ./my-cli --out demo.md
  tool-demo-script verify demo.md --repo ./my-cli
```

## Runnable Demo

Generate and verify a demo from the committed fixture CLI:

```bash
bash demo/run-fixture-demo.sh
npm run release:check
```

The script writes demo Markdown, narration metadata, and a verification log to a
temporary directory. See `docs/tutorials/generate-and-verify-fixture-demo.md` for
the full recipe.

To focus on the file-backed confidence report for the same fixture:

```bash
bash demo/fixture-confidence-report.sh
```

See `docs/tutorials/fixture-confidence-report.md` for the walkthrough.

## Release Verification

```bash
npm run package:smoke
npm run release:check
```

`package:smoke` runs `npm pack --dry-run` and confirms the package includes the
CLI, source modules, fixture CLI, release docs, and README. `release:check`
combines syntax checks, tests, fixture demo generation, and package smoke for
the same verification path locally and in CI.

The npm package ships the CLI, source modules, fixture CLI, release docs,
README, MIT license, security policy, contribution guide, and changelog. The
package smoke check fails if any of those release-facing files are missing from
the dry-run tarball.

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

## Demo Assets

- `docs/tutorials/fixture-cli-demo.md` shows the fixture CLI demo flow.
- `docs/tutorials/fixture-confidence-report.md` shows the confidence report flow.
- `docs/tutorials/promo-review-packet.md` shows the one-folder review packet for
  demo recording or README updates.
- `docs/promo/fixture-demo-brief.md` provides a short video/social brief.
- `docs/promo/confidence-report-social-hooks.md` provides short post hooks.

## Safety Notes

- Demo detection is read-only
- Verification runs commands in the repo directory with a 5s timeout
- Direct `node <entry>` commands and command names declared in the target
  package's `bin` field are resolved to their local entry files
- npm install commands are excluded from verification
- Safe command allowlist: `--version`, `-V`, `--help`, `-h`, `version`, `help`, `info`, `list`, `ls`

See [SECURITY.md](SECURITY.md) before verifying demos from untrusted
repositories or enabling `--allow-unsafe`.
