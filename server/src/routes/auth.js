const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');

const router = express.Router();

// Admin accounts are not created through sign-up
const ROLES = ['youth', 'mentor', 'investor'];

router.post('/register', (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email and password are required' });
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
    .prepare('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)')
    .run(cleanName, cleanEmail, passwordHash, userRole);
  db.prepare('INSERT INTO profiles (user_id) VALUES (?)').run(result.lastInsertRowid);

  const user = { id: result.lastInsertRowid, name: cleanName, email: cleanEmail, role: userRole };
  res.status(201).json({ user });
});

module.exports = router;
