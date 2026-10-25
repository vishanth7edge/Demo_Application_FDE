// Run from the repo root: node test/scripts/run-parallel.js <profile> [<profile>...]
// Each profile (from test/cucumber.config.js) runs in its own process/browser.
const { spawn } = require('child_process');
const path = require('path');

const repoRoot = path.join(__dirname, '..', '..');
const cucumber = path.join(repoRoot, 'node_modules', '.bin', 'cucumber-js');
const config = path.join(repoRoot, 'test', 'cucumber.config.js');

const modules = process.argv.slice(2);
if (!modules.length) {
  console.error('Usage: node test/scripts/run-parallel.js <profile> [<profile>...]');
  process.exit(1);
}

const run = (mod) =>
  new Promise((resolve) => {
    let output = '';
    const child = spawn(cucumber, ['--config', config, '--profile', mod], {
      cwd: repoRoot,
      env: { ...process.env, FLOW_NAME: mod },
    });
    child.stdout.on('data', (d) => { output += d; });
    child.stderr.on('data', (d) => { output += d; });
    child.on('exit', (code) => resolve({ mod, code, output }));
  });

Promise.all(modules.map(run)).then((results) => {
  const line = '─'.repeat(60);
  for (const { mod, code, output } of results) {
    process.stdout.write(`\n${line}\n  ${mod.toUpperCase()}  —  ${code === 0 ? 'PASSED' : 'FAILED'}\n${line}\n${output}`);
  }
  if (results.some((r) => r.code !== 0)) process.exit(1);
});
