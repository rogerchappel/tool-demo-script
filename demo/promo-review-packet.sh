#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repo_root"

out_dir="${TMPDIR:-/tmp}/tool-demo-script-promo-packet"
rm -rf "$out_dir"
mkdir -p "$out_dir"

node bin/tool-demo-script.js demo \
  --repo fixtures/fixture-cli \
  --out "$out_dir/demo.md" \
  --narration > "$out_dir/narration-and-confidence.txt"

node - <<'NODE' > "$out_dir/packet.json"
const { generate } = require('./src');
const bundle = generate('fixtures/fixture-cli');
console.log(JSON.stringify({
  repo: 'fixtures/fixture-cli',
  entryPoint: bundle.entryPoint,
  narration: bundle.narration,
  confidence: bundle.confidence
}, null, 2));
NODE

node bin/tool-demo-script.js verify "$out_dir/demo.md" \
  --repo fixtures/fixture-cli > "$out_dir/verify.txt"

cat > "$out_dir/MANIFEST.md" <<EOF
# tool-demo-script Promo Review Packet

- Demo script: demo.md
- Narration and confidence text: narration-and-confidence.txt
- Structured packet: packet.json
- Verification log: verify.txt
EOF

grep -q "# Demo: fixture-cli" "$out_dir/demo.md"
grep -q '"name": "fixture-cli"' "$out_dir/packet.json"
grep -q '"score": 100' "$out_dir/packet.json"
grep -q "Verified: 1 passed, 0 failed" "$out_dir/verify.txt"
test -s "$out_dir/MANIFEST.md"

echo "Promo review packet: $out_dir"
