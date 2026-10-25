// No .env file: values come from the process environment (shell exports locally,
// pipeline variables in CI). Defaults are for local development only.
const optional = (key, fallback) => process.env[key] ?? fallback;

const env = {
  BASE_URL: optional('BASE_URL', 'http://localhost:3000'),
  API_URL: optional('API_URL', 'http://localhost:3001'),

  HEADLESS: optional('HEADLESS', 'true') === 'true',
  SLOW_MO: parseInt(optional('SLOW_MO', '0'), 10),

  TEST_USER_EMAIL: optional('TEST_USER_EMAIL', ''),
  TEST_USER_PASSWORD: optional('TEST_USER_PASSWORD', ''),
  TEST_USER_OTP: optional('TEST_USER_OTP', ''),
  TEST_ADMIN_EMAIL: optional('TEST_ADMIN_EMAIL', ''),
  TEST_ADMIN_PASSWORD: optional('TEST_ADMIN_PASSWORD', ''),
  TEST_ADMIN_OTP: optional('TEST_ADMIN_OTP', ''),
};

module.exports = { env };
