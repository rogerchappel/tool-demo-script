# Release Candidate: tool-demo-script v1.0.0

## Scope
CLI demo script generator and verifier for Node.js projects.

## Capabilities
- **Endpoint detection**: Reads package.json bin/scripts for CLI entrypoints
- **Demo generation**: Markdown install → usage → test → example sections
- **Narration extraction**: Title, sections, duration, key commands for videos/talks
- **Confidence scoring**: 6 dimensions — package, README, LICENSE, CI, examples, tests
- **Smoke verification**: Safe command allowlist with 5s timeout
- **CLI**: `tool-demo-script demo --repo ./my-cli` and `tool-demo-script verify ./demo.md --repo ./my-cli`
- **Fixture-backed tests**: 8 tests across 4 suites passing

## Verification Results
```
$ bash scripts/validate.sh
✔ detector 3 tests
✔ generator 3 tests  
✔ end-to-end 1 test
✔ smoke verification 1 test
=== All validations passed ===
```

## Branch Protection
- main is protected (PR required, 1 approval)
- Admins may bypass

## Classification: ship  
Ready for agent builders to generate and verify CLI demos from any Node.js repo.
