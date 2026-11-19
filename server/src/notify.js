const db = require('./db');
const { sendToUser } = require('./realtime');

// Saves a notification for a user and sends it live if they are online.
// type is a short word such as 'connection', 'team', 'message' or 'feedback'.
// link is the page the notification opens, for example '/connections'.
function notify(userId, type, text, link = '') {
  const result = db
    .prepare('INSERT INTO notifications (user_id, type, text, link) VALUES (?, ?, ?, ?)')
    .run(userId, type, text, link);

  sendToUser(userId, 'notification', { id: result.lastInsertRowid, type, text, link });
}

module.exports = notify;
