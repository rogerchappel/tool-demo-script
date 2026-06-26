# Security Policy

`tool-demo-script` is a local-first CLI. It inspects a target repository and may
execute allowlisted demo verification commands when requested.

## Reporting a Vulnerability

Please report suspected vulnerabilities through GitHub Security Advisories for
this repository. Include the affected version or commit, a minimal reproduction,
and whether the issue requires running `verify` or using `--allow-unsafe`.

## Handling Untrusted Repositories

- Review generated demo commands before running `verify`.
- Avoid `--allow-unsafe` for repositories you do not control.
- Run verification in a disposable checkout when testing unknown projects.
- Do not include private tokens, credentials, or customer data in fixtures or
  generated demo scripts.
