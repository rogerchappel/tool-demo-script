# Contributing

Thanks for improving `tool-demo-script`.

## Local Checks

Run the release gate before opening a pull request:

```bash
npm run release:check
```

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
