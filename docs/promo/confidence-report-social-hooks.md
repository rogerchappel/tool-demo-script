# Confidence Report Social Hooks

- "A generated CLI demo is more useful when it says what repo evidence it found."
- "tool-demo-script can emit a Markdown walkthrough and a confidence report from the same fixture."
- "Before recording a CLI demo, check whether the repo has package metadata, docs, license, CI, examples, and tests."
- "This demo does not claim adoption. It shows file-backed confidence for a local Node CLI fixture."

## Demo command

```bash
bash demo/fixture-confidence-report.sh
```

## Grounded talking points

- The confidence score is derived from files in `fixtures/fixture-cli`.
- The generated Markdown demo and verification log are written to a temporary
  directory for inspection.
- Verification still uses the safe command allowlist unless unsafe commands are
  explicitly enabled.
