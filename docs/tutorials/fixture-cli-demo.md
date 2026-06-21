# Generate And Verify A Fixture CLI Demo

This tutorial uses the checked-in `fixtures/fixture-cli` package to demonstrate
the full tool-demo-script loop: detect a CLI, write a Markdown demo, export
narration metadata from the library API, and verify safe commands.

## Run It

```bash
bash demo/run-fixture-demo.sh
```

The script writes:

- `demo.md`, a generated CLI demo script
- `narration.json`, section and key-command metadata for video prep

It then verifies the demo against `fixtures/fixture-cli` using the built-in safe
command allowlist.

## What To Show

1. Open `fixtures/fixture-cli/package.json` to show the detected bin metadata.
2. Run the demo script.
3. Open the generated Markdown and narration JSON.
4. Re-run `node bin/tool-demo-script.js verify "$demo" --repo fixtures/fixture-cli`
   to show that generated commands are smoke tested.
