# Video Brief: CLI Demo Script in One Pass

## Hook

"Given a Node CLI repo, generate the demo script and then verify the commands
before recording."

## Demo beats

1. Open `fixtures/fixture-cli/package.json` to show the CLI entrypoint.
2. Run `bash demo/run-fixture-demo.sh`.
3. Open the generated `demo.md` path printed by the script.
4. Show the narration metadata and confidence details.
5. Open `verify.txt` to confirm the generated safe commands were checked.

## Limits to mention

- The detector is for Node.js CLI repositories.
- Verification runs local commands with a short timeout.
- Install commands are generated for the script but excluded from verification.
