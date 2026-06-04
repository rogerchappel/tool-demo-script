#!/bin/bash
set -euo pipefail
echo "=== tool-demo-script validation ==="

# 1. Check structure
for f in package.json bin/tool-demo-script.js src/index.js src/detector.js src/generator.js src/smoke.js; do
  [ -f "$f" ] || { echo "FAIL: $f missing"; exit 1; }
done

# 2. Check docs
for f in README.md SKILL.md docs/PRD.md docs/TASKS.md docs/ORCHESTRATION.md; do
  [ -f "$f" ] || { echo "FAIL: $f missing"; exit 1; }
done

# 3. Check fixtures
[ -d "fixtures/fixture-cli" ] || { echo "FAIL: fixtures missing"; exit 1; }

# 4. Run tests
node --test test/*.test.js

# 5. Run smoke
bin/tool-demo-script.js demo --repo fixtures/fixture-cli --out _demo_out.md
echo "Smoke demo output size: $(wc -c < _demo_out.md) bytes"

# 6. Clean up
rm -f _demo_out.md

echo "=== All validations passed ==="
