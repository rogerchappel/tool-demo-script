# ORCHESTRATION: tool-demo-script

## Architecture

```
bin/tool-demo-script.js    ← CLI entrypoint
  └── src/index.js         ← generate(), verify() orchestrators
       ├── src/detector.js     ← detect package.json, bin, scripts, CI
       ├── src/generator.js    ← generate demo script, narration, confidence
       └── src/smoke.js        ← run safe commands with timeout
```

## Data Flow

1. CLI parses action: demo or verify
2. `detectEntryPoint()` reads package.json, finds bin/scripts, checks repo state
3. `generateDemoScript()` produces Markdown with sections for install, version, usage
4. `generateNarration()` extracts metadata for video/talk planning
5. `generateConfidenceReport()` scores 6 dimensions
6. `verify()` optionally runs safe commands with 5s timeout

## Adding New Language Support

1. Add detector logic in `detector.js` for the language's package/entry format
2. Update `generateDemoScript` for install/run patterns
3. Add fixture for that ecosystem
4. Update SKILL.md limitations section
