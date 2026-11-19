const express = require('express');
const db = require('../db');
const requireAuth = require('../middleware/auth');
const { areConnected } = require('../connectionHelpers');
const { sendToUser } = require('../realtime');
const notify = require('../notify');

const router = express.Router();
router.use(requireAuth);

const MESSAGE_FIELDS = `id, sender_id AS senderId, receiver_id AS receiverId, body,
       read_at AS readAt, created_at AS createdAt`;

// Lists my conversations, newest first, with the last message and unread count
router.get('/', (req, res) => {
  const me = req.user.id;
  const messages = db
    .prepare(`SELECT ${MESSAGE_FIELDS} FROM messages WHERE sender_id = ? OR receiver_id = ? ORDER BY id DESC`)
    .all(me, me);

  const conversations = [];
  const seen = {};

  for (const message of messages) {
    const otherId = message.senderId === me ? message.receiverId : message.senderId;

    if (!seen[otherId]) {
      const other = db.prepare('SELECT id, name FROM users WHERE id = ?').get(otherId);
      seen[otherId] = { user: other, lastMessage: message, unread: 0 };
      conversations.push(seen[otherId]);
    }
    if (message.receiverId === me && !message.readAt) {
      seen[otherId].unread += 1;
    }
  }

  res.json({ conversations });
});

// All messages between me and another user. Opening the conversation marks them as read.
router.get('/:userId', (req, res) => {
  const me = req.user.id;
  const otherId = Number(req.params.userId);

  const other = db.prepare('SELECT id, name FROM users WHERE id = ?').get(otherId);
  if (!other) {
    return res.status(404).json({ error: 'User not found' });
  }

  const messages = db
    .prepare(
      `SELECT ${MESSAGE_FIELDS} FROM messages
       WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)
       ORDER BY id`
    )
    .all(me, otherId, otherId, me);

  db.prepare("UPDATE messages SET read_at = datetime('now') WHERE sender_id = ? AND receiver_id = ? AND read_at IS NULL").run(
    otherId,
    me
  );

  res.json({ user: other, messages, canSend: areConnected(me, otherId) });
});

// Send a message. Only connected users can message each other.
router.post('/:userId', (req, res) => {
  const receiverId = Number(req.params.userId);
  const body = String(req.body.body || '').trim();

  if (!body) {
    return res.status(400).json({ error: 'Message cannot be empty' });
  }
  if (body.length > 2000) {
    return res.status(400).json({ error: 'Message must be 2000 characters or less' });
  }
  if (!areConnected(req.user.id, receiverId)) {
    return res.status(403).json({ error: 'You can only send messages to your connections' });
  }

  const result = db
    .prepare('INSERT INTO messages (sender_id, receiver_id, body) VALUES (?, ?, ?)')
    .run(req.user.id, receiverId, body);
  const message = db.prepare(`SELECT ${MESSAGE_FIELDS} FROM messages WHERE id = ?`).get(result.lastInsertRowid);

  // Deliver the message straight away if the receiver has YouthLink open
  sendToUser(receiverId, 'message', message);
  notify(receiverId, 'message', `New message from ${req.user.name}`, `/messages/${req.user.id}`);

  res.status(201).json({ message });
});

module.exports = router;
