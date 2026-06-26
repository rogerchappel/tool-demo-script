#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
out_dir="${TMPDIR:-/tmp}/tool-demo-script-confidence"

cd "$repo_root"
rm -rf "$out_dir"
mkdir -p "$out_dir"

node - <<'NODE' >"$out_dir/confidence.json"
const { generate } = require('./src');
const bundle = generate('fixtures/fixture-cli');
console.log(JSON.stringify({
  name: bundle.entryPoint.name,
  version: bundle.entryPoint.version,
  score: bundle.confidence.score,
  passed: bundle.confidence.passed,
  failed: bundle.confidence.failed,
  checks: bundle.confidence.checks
}, null, 2));
NODE

node bin/tool-demo-script.js demo --repo fixtures/fixture-cli --out "$out_dir/demo.md" --narration >"$out_dir/narration.txt"
node bin/tool-demo-script.js verify "$out_dir/demo.md" --repo fixtures/fixture-cli >"$out_dir/verify.txt"

grep -q '"name": "fixture-cli"' "$out_dir/confidence.json"
grep -q '"score": 100' "$out_dir/confidence.json"
grep -q '"failed": 0' "$out_dir/confidence.json"
grep -q "# Demo: fixture-cli" "$out_dir/demo.md"
grep -q "Verified: 1 passed, 0 failed" "$out_dir/verify.txt"

echo "Confidence report: $out_dir/confidence.json"
echo "Generated demo: $out_dir/demo.md"
echo "Narration output: $out_dir/narration.txt"
echo "Verification log: $out_dir/verify.txt"
