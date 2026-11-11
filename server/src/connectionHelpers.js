const db = require('./db');

// Finds the connection between two users.
function findConnection(userA, userB) {
  return db
    .prepare(
      `SELECT * FROM connections
       WHERE requester_id = ? AND receiver_id = ?`
    )
    .get(userA, userB);
}

function areConnected(userA, userB) {
  const connection = findConnection(userA, userB);
  return Boolean(connection && connection.status === 'accepted');
}

module.exports = { findConnection, areConnected };
