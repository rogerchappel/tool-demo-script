# Promo Review Packet

This recipe creates one local folder with the artifacts a maintainer can review
before recording or publishing a CLI demo.

## Run it

```bash
bash demo/promo-review-packet.sh
```

The script uses the committed `fixtures/fixture-cli` project and writes a packet
under `$TMPDIR/tool-demo-script-promo-packet` or
`/tmp/tool-demo-script-promo-packet`.

## Packet contents

- `demo.md` contains the generated Markdown walkthrough.
- `narration-and-confidence.txt` contains the CLI narration output.
- `packet.json` contains structured entry point, narration, and confidence data.
- `verify.txt` records the safe-command verification result.
- `MANIFEST.md` lists the files for quick review.

The fixture is intentionally small: it has a package entry point, README,
license, examples, and tests, so the confidence report reaches 100 while the
verification log still shows exactly which generated commands were safe to run.

## Promotion use

Use this packet as a source folder for a short screen recording or a README demo
update. The generated Markdown remains editable, and the verification log gives
reviewers a concrete command result to cite.
