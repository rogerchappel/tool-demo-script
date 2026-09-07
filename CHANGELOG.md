# Changelog

## Unreleased

- Fail verification when every discovered command is skipped, and make the
  release smoke path execute the deterministic fixture version command.
- Support CRLF line endings when verifying Markdown `bash` command fences.
- Add root release trust files for license, security reporting, and
  contribution guidance.
- Extend package smoke coverage to assert those public-facing files are present
  in the npm tarball.
