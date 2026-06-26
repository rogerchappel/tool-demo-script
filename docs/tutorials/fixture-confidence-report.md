# Fixture Confidence Report

This recipe shows how `tool-demo-script` turns a Node CLI repository into a
small demo bundle and a confidence report grounded in files that exist in the
target repo.

## Run it

```bash
bash demo/fixture-confidence-report.sh
```

The script writes its outputs to
`${TMPDIR:-/tmp}/tool-demo-script-confidence`:

- `confidence.json`
- `demo.md`
- `narration.txt`
- `verify.txt`

## What the confidence report checks

The fixture CLI includes a `package.json`, README, LICENSE, CI workflow,
examples directory, and test script. The report lists each of those checks and
scores the fixture from observed files instead of inferred popularity or usage.

## Use it in promotion

For a short walkthrough, show `confidence.json` before the generated `demo.md`.
That makes the demo useful for maintainers who want to know why a generated
script is trustworthy enough to review.
