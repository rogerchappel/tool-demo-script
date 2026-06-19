#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repo_root"

out_dir="${TMPDIR:-/tmp}/tool-demo-script-fixture"
rm -rf "$out_dir"
mkdir -p "$out_dir"

node bin/tool-demo-script.js demo --repo fixtures/fixture-cli --out "$out_dir/demo.md" > "$out_dir/demo.md"
node -e "const { generate } = require('./src'); const bundle = generate('fixtures/fixture-cli'); console.log(JSON.stringify(bundle.narration, null, 2));" > "$out_dir/narration.json"
node bin/tool-demo-script.js verify "$out_dir/demo.md" --repo fixtures/fixture-cli

test -s "$out_dir/demo.md"
test -s "$out_dir/narration.json"
grep -q "# Demo:" "$out_dir/demo.md"
grep -q "keyCommands" "$out_dir/narration.json"

echo "Generated fixture demo: $out_dir"
