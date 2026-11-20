const jwt = require('jsonwebtoken');
const db = require('../db');
const config = require('../config');

// Checks the token sent in the Authorization header and loads the user.
function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Please log in first' });
  }

  let payload;
  try {
    payload = jwt.verify(token, config.jwtSecret);
  } catch (err) {
    return res.status(401).json({ error: 'Your session has expired, please log in again' });
  }

  const user = db.prepare('SELECT id, name, email, role, suspended_at FROM users WHERE id = ?').get(payload.id);
  if (!user) {
    return res.status(401).json({ error: 'Account not found' });
  }
  // A suspended user is logged out even if they still have a valid token
  if (user.suspended_at) {
    return res.status(403).json({ error: 'Your account has been suspended. Please contact YouthLink support.' });
  }

  req.user = { id: user.id, name: user.name, email: user.email, role: user.role };
  next();
}

module.exports = requireAuth;
