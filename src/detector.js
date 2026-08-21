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
    exampleEvidence: { files: [], detail: 'no example directories found' },
    ciEvidence: { files: [], detail: 'no supported CI locations found' },
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

      // Extract a directly runnable entry from a simple Node start script.
      const startEntry = inferNodeStartEntry(repoPath, result.startCommand);
      if (!result.binEntry && !result.entryPoint && startEntry) {
        result.entryPoint = startEntry;
        if (!result.commands.some(c => c.name === result.name)) {
          result.commands.push({ name: result.name, entry: startEntry });
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
  const presentExampleDirs = exampleDirs.filter(d => isDirectory(path.join(repoPath, d)));
  const exampleFiles = presentExampleDirs.flatMap(d =>
    substantiveFiles(path.join(repoPath, d), file => /\.(?:md|sh)$/i.test(file))
      .map(file => path.join(d, file)));
  result.hasExamples = exampleFiles.length > 0;
  result.exampleEvidence = {
    files: exampleFiles,
    detail: result.hasExamples
      ? `usable artifacts: ${exampleFiles.join(', ')}`
      : presentExampleDirs.length
        ? 'example directories found, but no usable .md or .sh artifacts detected'
        : 'no example directories found',
  };

  // Check CI
  const workflowDir = path.join(repoPath, '.github', 'workflows');
  const ciFiles = isDirectory(workflowDir)
    ? substantiveFiles(workflowDir, file => /\.ya?ml$/i.test(file))
      .map(file => path.join('.github', 'workflows', file))
    : [];
  const standaloneCI = ['.gitlab-ci.yml', '.circleci/config.yml', '.travis.yml'];
  ciFiles.push(...standaloneCI.filter(file => isSubstantiveFile(path.join(repoPath, file))));
  const hasCILocation = isDirectory(workflowDir)
    || standaloneCI.some(file => fs.existsSync(path.join(repoPath, file)));
  result.hasCI = ciFiles.length > 0;
  result.ciEvidence = {
    files: ciFiles,
    detail: result.hasCI
      ? `configuration files: ${ciFiles.join(', ')}`
      : hasCILocation
        ? 'CI locations found, but no substantive configuration files detected'
        : 'no supported CI locations found',
  };

  return result;
}

function isDirectory(candidate) {
  return fs.existsSync(candidate) && fs.statSync(candidate).isDirectory();
}

function isSubstantiveFile(candidate) {
  return fs.existsSync(candidate)
    && fs.statSync(candidate).isFile()
    && fs.readFileSync(candidate, 'utf8').trim().length > 0;
}

function substantiveFiles(directory, supportsFile) {
  return fs.readdirSync(directory)
    .filter(file => supportsFile(file) && isSubstantiveFile(path.join(directory, file)))
    .sort();
}

function inferNodeStartEntry(repoPath, startCommand) {
  if (typeof startCommand !== 'string') return null;

  const match = startCommand.match(/^\s*node\s+(?:"([^"]+)"|'([^']+)'|(\S+))(?:\s|$)/);
  const candidate = match && (match[1] || match[2] || match[3]);
  if (!candidate || candidate.startsWith('-') || /[;&|`$<>]/.test(candidate)) return null;

  const candidatePath = path.resolve(repoPath, candidate);
  return fs.existsSync(candidatePath) && fs.statSync(candidatePath).isFile() ? candidate : null;
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
