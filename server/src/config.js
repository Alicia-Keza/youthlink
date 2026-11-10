const path = require('path');

// Settings come from environment variables, with defaults for local development.
module.exports = {
  port: process.env.PORT || 4000,
  dbFile: process.env.DB_FILE || path.join(__dirname, '..', 'youthlink.db'),
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
};
