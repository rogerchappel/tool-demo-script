const { describe, it } = require('node:test');
const assert = require('node:assert');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { execFileSync, spawnSync } = require('child_process');
const { detectEntryPoint } = require('../src/detector');
const { generateDemoScript, generateNarration, generateConfidenceReport } = require('../src/generator');
const { runSmoke } = require('../src/smoke');
const { generate, verify } = require('../src/index');

const FIXTURE_PATH = path.join(__dirname, '..', 'fixtures', 'fixture-cli');
const CLI_PATH = path.join(__dirname, '..', 'bin', 'tool-demo-script.js');
const README_PATH = path.join(__dirname, '..', 'README.md');

describe('detector', () => {
  it('finds package.json and bin entry', () => {
    const entry = detectEntryPoint(FIXTURE_PATH);
    assert.strictEqual(entry.hasPackageJson, true);
    assert.strictEqual(entry.name, 'fixture-cli');
    assert.strictEqual(entry.version, '0.1.0');
    assert.notStrictEqual(entry.binEntry, null);
    assert.ok(entry.commands.length > 0);
  });

  it('detects readme, license, examples, and ci', () => {
    const entry = detectEntryPoint(FIXTURE_PATH);
    assert.strictEqual(entry.hasReadme, true);
    assert.strictEqual(entry.hasLicense, true);
    assert.strictEqual(entry.hasExamples, true);
    assert.strictEqual(entry.hasCI, true);
  });

  it('handles non-existent path gracefully', () => {
    const entry = detectEntryPoint('/tmp/does-not-exist-xyz');
    assert.strictEqual(entry.hasPackageJson, false);
    assert.strictEqual(entry.name, 'unknown');
  });
});

describe('generator', () => {
  it('generates demo script with sections', () => {
    const entry = detectEntryPoint(FIXTURE_PATH);
    const demo = generateDemoScript(FIXTURE_PATH, entry);
    assert.ok(demo.length > 100);
    assert.ok(demo.includes('# Demo:'));
    assert.ok(demo.includes('## 1. Install'));
    assert.ok(demo.includes('node'));
  });

  it('extracts narration from demo', () => {
    const entry = detectEntryPoint(FIXTURE_PATH);
    const demo = generateDemoScript(FIXTURE_PATH, entry);
    const narration = generateNarration(demo);
    assert.ok(narration.title);
    assert.ok(narration.sections > 0);
    assert.ok(narration.keyCommands.length > 0);
  });

  it('generates confidence report for fixture', () => {
    const entry = detectEntryPoint(FIXTURE_PATH);
    const demo = generateDemoScript(FIXTURE_PATH, entry);
    const report = generateConfidenceReport(FIXTURE_PATH, entry, demo);
    assert.ok(report.score >= 80, `Expected score >= 80, got ${report.score}`);
    assert.ok(report.passed >= 5);
    assert.ok(report.failed === 0);
  });

  it('preserves Markdown examples without treating prose as commands', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tool-demo-script-markdown-'));
    const examplesDir = path.join(tmpDir, 'examples');
    fs.mkdirSync(examplesDir);
    fs.writeFileSync(path.join(examplesDir, 'guide.md'), [
      '### Guided example',
      '',
      'Run this:',
      '',
      '```bash',
      'fixture-cli --help',
      '```',
    ].join('\n'));

    const entry = detectEntryPoint(FIXTURE_PATH);
    const demo = generateDemoScript(tmpDir, entry);
    const narration = generateNarration(demo);
    const report = await runSmoke(FIXTURE_PATH, demo);

    assert.match(demo, /## Demo: guide\n\n### Guided example/);
    assert.strictEqual((demo.match(/^```bash$/gm) || []).length, 5);
    assert.strictEqual((demo.match(/^```$/gm) || []).length, 5);
    assert.ok(narration.keyCommands.includes('fixture-cli --help'));
    assert.ok(!narration.keyCommands.includes('Run this:'));
    assert.strictEqual(report.failed, 0, JSON.stringify(report.details));
    assert.ok(report.details.some((detail) =>
      detail.command === 'fixture-cli --help' && detail.status === 'passed'));
    assert.ok(!report.details.some((detail) => detail.command === 'Run this:'));
  });
});

describe('end-to-end generate', () => {
  it('produces demo with all expected fields', () => {
    const result = generate(FIXTURE_PATH);
    assert.ok(result.scriptMarkdown);
    assert.ok(result.narration);
    assert.ok(result.confidence);
    assert.ok(result.entryPoint);
    assert.strictEqual(result.entryPoint.hasPackageJson, true);
  });

  it('writes CLI demo output when --out is provided', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tool-demo-script-test-'));
    const outFile = path.join(tmpDir, 'demo.md');

    execFileSync(process.execPath, [
      path.join(__dirname, '..', 'bin', 'tool-demo-script.js'),
      'demo',
      '--repo',
      FIXTURE_PATH,
      '--out',
      outFile
    ], { encoding: 'utf8' });

    const demo = fs.readFileSync(outFile, 'utf8');
    assert.match(demo, /# Demo: fixture-cli/);
  });

  it('executes the documented Quickstart demo command against the fixture', () => {
    const readme = fs.readFileSync(README_PATH, 'utf8');
    const quickstart = readme.match(/## Quickstart\n\n```bash\n([\s\S]*?)```/);
    assert.ok(quickstart, 'README Quickstart shell block is missing');

    const documentedCommand = quickstart[1]
      .split('\n')
      .find((line) => line.startsWith('tool-demo-script demo '));
    assert.ok(documentedCommand, 'README Quickstart demo command is missing');

    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tool-demo-script-readme-test-'));
    const outFile = path.join(tmpDir, 'demo.md');
    const args = documentedCommand
      .split(/\s+/)
      .slice(1)
      .map((arg) => arg === './my-cli' ? FIXTURE_PATH : arg === 'demo.md' ? outFile : arg);

    execFileSync(process.execPath, [CLI_PATH, ...args], { encoding: 'utf8' });

    const demo = fs.readFileSync(outFile, 'utf8');
    assert.match(demo, /# Demo: fixture-cli/);
  });
});

describe('CLI argument parsing', () => {
  function runCli(args) {
    return spawnSync(process.execPath, [CLI_PATH, ...args], { encoding: 'utf8' });
  }

  function makeDemo() {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tool-demo-script-cli-'));
    const demoPath = path.join(tmpDir, 'demo.md');
    fs.writeFileSync(demoPath, '```bash\nfixture-cli --help\n```\n');
    return demoPath;
  }

  it('accepts verify options before or after the demo path', () => {
    const demoPath = makeDemo();
    for (const args of [
      ['verify', '--repo', FIXTURE_PATH, demoPath],
      ['verify', demoPath, '--repo', FIXTURE_PATH],
    ]) {
      const result = runCli(args);
      assert.strictEqual(result.status, 0, result.stderr);
      assert.match(result.stdout, /Verified: 1 passed/);
    }
  });

  it('rejects missing option operands without a stack trace', () => {
    for (const args of [['demo', '--repo'], ['demo', '--repo', '--out', 'demo.md'], ['verify', makeDemo(), '--repo']]) {
      const result = runCli(args);
      assert.strictEqual(result.status, 1);
      assert.match(result.stderr, /requires a value/);
      assert.doesNotMatch(result.stderr, /\n\s+at /);
    }
  });

  it('rejects unknown options and extra positional arguments', () => {
    for (const args of [
      ['demo', '--repo', FIXTURE_PATH, '--bogus'],
      ['demo', '--repo', FIXTURE_PATH, 'extra'],
      ['verify', makeDemo(), '--repo', FIXTURE_PATH, 'extra'],
    ]) {
      const result = runCli(args);
      assert.strictEqual(result.status, 1);
      assert.match(result.stderr, /unknown option|unexpected argument/);
    }
  });

  it('reports unreadable demo and repository inputs concisely', () => {
    const missing = path.join(os.tmpdir(), `tool-demo-script-missing-${process.pid}`);
    for (const args of [
      ['verify', missing, '--repo', FIXTURE_PATH],
      ['verify', makeDemo(), '--repo', missing],
      ['demo', '--repo', missing],
    ]) {
      const result = runCli(args);
      assert.strictEqual(result.status, 1);
      assert.match(result.stderr, /is not readable/);
      assert.doesNotMatch(result.stderr, /\n\s+at /);
    }
  });
});

describe('smoke verification', async () => {
  it('runs direct node entries and declared package bins', async () => {
    const demo = [
      '```bash',
      'node index.js --version',
      'fixture-cli --help',
      '```',
    ].join('\n');

    const report = await runSmoke(FIXTURE_PATH, demo);

    assert.strictEqual(report.failed, 0, JSON.stringify(report.details));
    assert.strictEqual(report.passed, 2);
    assert.deepStrictEqual(
      report.details.map((detail) => [detail.command, detail.status]),
      [['node index.js --version', 'passed'], ['fixture-cli --help', 'passed']],
    );
  });

  it('runs direct node entries and declared package bins from CRLF fences', async () => {
    const demo = [
      '```bash',
      'node index.js --version',
      'fixture-cli --help',
      '```',
    ].join('\r\n');

    const report = await runSmoke(FIXTURE_PATH, demo);

    assert.strictEqual(report.failed, 0, JSON.stringify(report.details));
    assert.strictEqual(report.passed, 2);
    assert.deepStrictEqual(
      report.details.map((detail) => [detail.command, detail.status]),
      [['node index.js --version', 'passed'], ['fixture-cli --help', 'passed']],
    );
  });

  it('reports CRLF fenced commands in CLI verification totals', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tool-demo-script-crlf-'));
    const demoPath = path.join(tmpDir, 'demo.md');
    fs.writeFileSync(demoPath, [
      '```bash',
      'fixture-cli --help',
      '```',
    ].join('\r\n'));

    const result = spawnSync(process.execPath, [
      CLI_PATH,
      'verify',
      demoPath,
      '--repo',
      FIXTURE_PATH,
    ], { encoding: 'utf8' });

    assert.strictEqual(result.status, 0, result.stderr);
    assert.match(result.stdout, /Verified: 1 passed, 0 failed, 0 skipped/);
    assert.doesNotMatch(result.stdout, /Verified: 0 passed/);
  });

  it('does not treat safe-looking substrings or shell syntax as allowlisted', async () => {
    const demo = [
      '```bash',
      'fixture-cli --helpful',
      'fixture-cli --help; echo unsafe',
      '```',
    ].join('\n');

    const report = await runSmoke(FIXTURE_PATH, demo);

    assert.strictEqual(report.skipped, 2);
    assert.strictEqual(report.passed, 0);
    assert.ok(report.details.every((detail) => detail.status === 'skipped'));
  });
});
