const express = require('express');
const db = require('../db');
const requireAuth = require('../middleware/auth');
const { findConnection } = require('../connectionHelpers');
const notify = require('../notify');

const router = express.Router();
router.use(requireAuth);

// Lists my requests and connections in three groups
router.get('/', (req, res) => {
  const me = req.user.id;
  const rows = db
    .prepare(
      `SELECT c.id, c.status, c.requester_id, c.created_at, u.id AS user_id, u.name AS user_name
       FROM connections c
       JOIN users u ON u.id = CASE WHEN c.requester_id = ? THEN c.receiver_id ELSE c.requester_id END
       WHERE (c.requester_id = ? OR c.receiver_id = ?) AND c.status != 'declined'
       ORDER BY c.created_at DESC`
    )
    .all(me, me, me);

  const incoming = [];
  const outgoing = [];
  const connected = [];

  for (const row of rows) {
    const item = {
      id: row.id,
      user: { id: row.user_id, name: row.user_name },
      createdAt: row.created_at,
    };
    if (row.status === 'accepted') connected.push(item);
    else if (row.requester_id === me) outgoing.push(item);
    else incoming.push(item);
  }

  res.json({ incoming, outgoing, connected });
});

router.post('/', (req, res) => {
  const receiverId = Number(req.body.userId);

  if (receiverId === req.user.id) {
    return res.status(400).json({ error: 'You cannot connect with yourself' });
  }
  const receiver = db.prepare('SELECT id FROM users WHERE id = ?').get(receiverId);
  if (!receiver) {
    return res.status(404).json({ error: 'User not found' });
  }

  const existing = findConnection(req.user.id, receiverId);
  if (existing && existing.status === 'accepted') {
    return res.status(409).json({ error: 'You are already connected' });
  }
  if (existing && existing.status === 'pending') {
    return res.status(409).json({ error: 'There is already a pending request between you' });
  }
  if (existing) {
    // A declined request can be sent again
    db.prepare('DELETE FROM connections WHERE id = ?').run(existing.id);
  }

  const result = db
    .prepare('INSERT INTO connections (requester_id, receiver_id) VALUES (?, ?)')
    .run(req.user.id, receiverId);

  notify(receiverId, 'connection', `${req.user.name} wants to connect with you`, '/connections');

  res.status(201).json({ connection: { id: result.lastInsertRowid, status: 'pending' } });
});

// Only the person who received a request can answer it
function answerRequest(status) {
  return (req, res) => {
    const result = db
      .prepare("UPDATE connections SET status = ? WHERE id = ? AND receiver_id = ? AND status = 'pending'")
      .run(status, req.params.id, req.user.id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Connection request not found' });
    }

    // Let the sender know when their request is accepted
    if (status === 'accepted') {
      const connection = db.prepare('SELECT requester_id FROM connections WHERE id = ?').get(req.params.id);
      notify(connection.requester_id, 'connection', `${req.user.name} accepted your connection request`, '/connections');
    }

    res.json({ connection: { id: Number(req.params.id), status } });
  };
}

router.put('/:id/accept', answerRequest('accepted'));
router.put('/:id/decline', answerRequest('declined'));

module.exports = router;
