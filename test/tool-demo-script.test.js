const { describe, it } = require('node:test');
const assert = require('node:assert');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { execFileSync } = require('child_process');
const { detectEntryPoint } = require('../src/detector');
const { generateDemoScript, generateNarration, generateConfidenceReport } = require('../src/generator');
const { runSmoke } = require('../src/smoke');
const { generate, verify } = require('../src/index');

const FIXTURE_PATH = path.join(__dirname, '..', 'fixtures', 'fixture-cli');

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
});

describe('smoke verification', async () => {
  it('passes for --version command', async () => {
    const entry = detectEntryPoint(FIXTURE_PATH);
    const demo = generateDemoScript(FIXTURE_PATH, entry);
    const report = await runSmoke(FIXTURE_PATH, demo, { allowUnsafe: true });
    // Should have at least one passed
    assert.ok(report.passed >= 1, `Expected at least 1 passed, got ${report.passed}`);
  });
});
