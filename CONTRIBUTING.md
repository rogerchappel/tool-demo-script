# Contributing

Thanks for improving `tool-demo-script`.

## Local Checks

Run the release gate before opening a pull request:

```bash
npm ci
npm run release:check
```

CI runs this clean-install release check on Node.js 18, the minimum version
declared by the package, and Node.js 24. Run it on both versions locally when
changing runtime-sensitive behavior or package metadata.

For smaller loops while developing:

```bash
npm run check
npm test
npm run smoke
npm run package:smoke
```

## Pull Requests

- Keep changes focused on one behavior, fixture, or documentation path.
- Add or update fixture coverage when demo generation or verification behavior
  changes.
- Update README or tutorial examples when command behavior changes.
- Note any commands that execute generated demo content.
