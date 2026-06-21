# Generate and Verify a Fixture Demo

This tutorial uses the committed `fixtures/fixture-cli` package to show the full
`tool-demo-script` loop: generate Markdown, capture narration metadata, and
verify the commands.

## Run it

```bash
bash demo/run-fixture-demo.sh
```

The script writes its outputs to a temporary directory:

- `demo.md` for the generated walkthrough
- `narration.txt` for narration metadata and confidence details
- `verify.txt` for the verification log

## What it demonstrates

The fixture has a `package.json`, README, LICENSE, example script, and test
directory. That lets the generated demo include install, version, usage, test,
and example sections without inventing project behavior.

## Adapt it

Replace `fixtures/fixture-cli` with another Node CLI repository when you want a
first-pass demo script for review.
