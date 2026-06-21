# tool-demo-script Demo Brief

## Promise

Show a CLI maintainer how to create a reusable Markdown demo from a local Node.js
CLI repo, then verify that the safe commands in the script still run.

## Demo flow

```sh
node bin/tool-demo-script.js demo --repo fixtures/fixture-cli --out /tmp/fixture-demo.md
node bin/tool-demo-script.js verify /tmp/fixture-demo.md --repo fixtures/fixture-cli
```

Open `/tmp/fixture-demo.md` and point out the generated install, version, run,
test, and fixture example sections. Then show the verification summary, including
passed commands and skipped commands that are outside the safe allowlist.

## Grounded talking points

- The generator reads `package.json`, README, LICENSE, CI, examples, and test
  scripts from the target repo.
- Verification avoids install commands and only runs safe commands unless
  `--allow-unsafe` is passed.
- The output is plain Markdown, so it can become a README demo, release note, or
  short video script.
