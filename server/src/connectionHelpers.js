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

// Describes the connection from the point of view of userId.
function connectionStatus(userId, otherId) {
  const connection = findConnection(userId, otherId);
  if (!connection || connection.status === 'declined') return 'none';
  if (connection.status === 'accepted') return 'connected';
  return connection.requester_id === userId ? 'request_sent' : 'request_received';
}

module.exports = { findConnection, areConnected, connectionStatus };
