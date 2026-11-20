const rateLimit = require('express-rate-limit');

// Stops someone from guessing passwords: after 10 wrong logins from the
// same address they have to wait 15 minutes. Successful logins do not count.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many failed login attempts. Please wait 15 minutes and try again.' },
});

// Stops one address from creating many accounts in a short time
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many accounts created. Please try again later.' },
});

module.exports = { loginLimiter, registerLimiter };
