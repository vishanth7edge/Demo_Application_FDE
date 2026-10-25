const { env } = require('../utils/env');

const users = {
  standard: {
    email: env.TEST_USER_EMAIL,
    password: env.TEST_USER_PASSWORD,
    otp: env.TEST_USER_OTP,
  },
  admin: {
    email: env.TEST_ADMIN_EMAIL,
    password: env.TEST_ADMIN_PASSWORD,
    otp: env.TEST_ADMIN_OTP,
  },
};

module.exports = { users };
