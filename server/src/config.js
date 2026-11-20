const path = require('path');

const isProduction = process.env.NODE_ENV === 'production';

// In production the login tokens must be signed with a real secret,
// otherwise anyone who reads this code could create a valid token.
if (isProduction && !process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET must be set in production');
}

// Settings come from environment variables, with defaults for local development.
module.exports = {
  isProduction,
  port: process.env.PORT || 4000,
  dbFile: process.env.DB_FILE || path.join(__dirname, '..', 'youthlink.db'),
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
};
