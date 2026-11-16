const db = require('./db');

function isMember(teamId, userId) {
  const row = db.prepare('SELECT 1 FROM team_members WHERE team_id = ? AND user_id = ?').get(teamId, userId);
  return Boolean(row);
}

module.exports = { isMember };
