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

  const user = db.prepare('SELECT id, name, email, role FROM users WHERE id = ?').get(payload.id);
  if (!user) {
    return res.status(401).json({ error: 'Account not found' });
  }

  req.user = user;
  next();
}

module.exports = requireAuth;
