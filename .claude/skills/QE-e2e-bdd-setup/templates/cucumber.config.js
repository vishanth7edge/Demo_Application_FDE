const path = require('path');

// Run from the REPO ROOT: `npx cucumber-js --config test/cucumber.config.js`
// All paths are __dirname-relative so cwd doesn't matter.
const base = {
  require: [
    // world + driver (hooks) must load before steps
    path.join(__dirname, 'support/world.js'),
    path.join(__dirname, 'support/driver.js'),
    path.join(__dirname, 'step-definitions/**/*.steps.js'),
  ],
  timeout: 30000,
};

const fmt = (name) => [
  'progress-bar',
  `json:${path.join(__dirname, 'reports', `cucumber-report-${name}.json`)}`,
];

module.exports = {
  // Everything, sequentially
  default: { ...base, paths: [path.join(__dirname, 'features/**/*.feature')], format: fmt('all') },

  // Add one profile per feature folder once modules exist, e.g.:
  // auth: { ...base, paths: [path.join(__dirname, 'features/auth/**/*.feature')], format: fmt('auth') },
};
