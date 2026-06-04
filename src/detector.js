/**
 * detector — find the CLI entrypoint and command surface of a repo
 */
const path = require('path');
const fs = require('fs');

function detectEntryPoint(repoPath) {
  const result = {
    hasPackageJson: false,
    name: 'unknown',
    version: '0.0.0',
    description: '',
    entryPoint: null,
    binEntry: null,
    scripts: {},
    commands: [],
    testCommand: null,
    startCommand: null,
    hasLicense: false,
    hasReadme: false,
    hasExamples: false,
    hasCI: false,
  };

  // Check package.json
  const pkgPath = path.join(repoPath, 'package.json');
  if (fs.existsSync(pkgPath)) {
    result.hasPackageJson = true;
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      result.name = pkg.name || 'unknown';
      result.version = pkg.version || '0.0.0';
      result.description = pkg.description || '';
      result.scripts = pkg.scripts || {};
      result.testCommand = pkg.scripts?.test || null;
      result.startCommand = pkg.scripts?.start || null;

      // Bin entry
      if (pkg.bin) {
        if (typeof pkg.bin === 'string') {
          result.binEntry = pkg.bin;
          result.commands.push({ name: result.name, entry: result.binEntry });
        } else if (typeof pkg.bin === 'object') {
          result.binEntry = Object.values(pkg.bin)[0] || null;
          for (const [cmdName, cmdPath] of Object.entries(pkg.bin)) {
            result.commands.push({ name: cmdName, entry: cmdPath });
          }
        }
      }

      // Main entry fallback
      if (!result.binEntry && pkg.main) {
        result.entryPoint = pkg.main;
      }

      // Extract commands from start script
      if (result.startCommand && result.startCommand.includes(' ')) {
        const parts = result.startCommand.split(' ');
        if (!result.commands.some(c => c.name === result.name)) {
          result.commands.push({ name: result.name, entry: parts[0] });
        }
      }
    } catch (err) {
      result.parseError = err.message;
    }
  }

  // Check for other entry files
  const mainFiles = ['index.js', 'index.ts', 'cli.js', 'cli.ts', 'main.js', 'main.ts', 'bin/cli.js', 'bin/index.js'];
  for (const f of mainFiles) {
    const fp = path.join(repoPath, f);
    if (fs.existsSync(fp) && !result.entryPoint && !result.binEntry) {
      result.entryPoint = f;
      break;
    }
  }

  // Check README
  const readmePath = findReadme(repoPath);
  result.hasReadme = !!readmePath;

  // Check LICENSE
  const licenseNames = ['LICENSE', 'LICENSE.md', 'LICENSE.txt', 'LICENCE', 'COPYING'];
  result.hasLicense = licenseNames.some(n => fs.existsSync(path.join(repoPath, n)));

  // Check examples
  const exampleDirs = ['examples', 'example', 'demo', 'demos', 'samples'];
  result.hasExamples = exampleDirs.some(d => {
    const p = path.join(repoPath, d);
    return fs.existsSync(p) && fs.statSync(p).isDirectory();
  });

  // Check CI
  const ciIndicators = ['.github/workflows', '.gitlab-ci.yml', '.circleci/config.yml', '.travis.yml'];
  result.hasCI = ciIndicators.some(ind => {
    const p = path.join(repoPath, ind);
    if (ind.endsWith('/')) return fs.existsSync(p) && fs.statSync(p).isDirectory();
    return fs.existsSync(p);
  });

  return result;
}

function findReadme(dir) {
  const names = ['README.md', 'README.rst', 'README.txt', 'README'];
  for (const n of names) {
    const p = path.join(dir, n);
    if (fs.existsSync(p)) return p;
  }
  return null;
}

module.exports = { detectEntryPoint };
