const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const config = require('../config');
const requireAuth = require('../middleware/auth');

const router = express.Router();

// Admin accounts are not created through sign-up
const ROLES = ['youth', 'mentor', 'investor'];

function createToken(user) {
  return jwt.sign({ id: user.id, role: user.role }, config.jwtSecret, { expiresIn: '7d' });
}

router.post('/register', (req, res) => {
  const { name, email, password, role, consent } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email and password are required' });
  }
  if (consent !== true) {
    return res.status(400).json({ error: 'You must agree to the use of your data to create an account' });
  }

  const cleanName = name.trim();
  const cleanEmail = email.trim().toLowerCase();
  const userRole = ROLES.includes(role) ? role : 'youth';

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(cleanEmail);
  if (existing) {
    return res.status(409).json({ error: 'An account with this email already exists' });
  }

  // Passwords are never stored as plain text
  const passwordHash = bcrypt.hashSync(password, 10);
  const result = db
    .prepare("INSERT INTO users (name, email, password_hash, role, consent_at) VALUES (?, ?, ?, ?, datetime('now'))")
    .run(cleanName, cleanEmail, passwordHash, userRole);
  db.prepare('INSERT INTO profiles (user_id) VALUES (?)').run(result.lastInsertRowid);

  const user = { id: result.lastInsertRowid, name: cleanName, email: cleanEmail, role: userRole };
  res.status(201).json({ token: createToken(user), user });
});

router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Incorrect email or password' });
  }

  res.json({
    token: createToken(user),
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
});

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

// Lets a user delete their account. Their profile, skills, connections
// and team memberships are removed with it.
router.delete('/me', requireAuth, (req, res) => {
  const { password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);

  if (!password || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Password is incorrect' });
  }

  db.prepare('DELETE FROM users WHERE id = ?').run(user.id);
  res.json({ message: 'Your account and data have been deleted' });
});

module.exports = router;
