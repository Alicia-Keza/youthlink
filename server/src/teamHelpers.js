const db = require('./db');

function isMember(teamId, userId) {
  const row = db.prepare('SELECT 1 FROM team_members WHERE team_id = ? AND user_id = ?').get(teamId, userId);
  return Boolean(row);
}

// The ids of everyone in a team, used to notify the whole team
function memberIds(teamId) {
  return db
    .prepare('SELECT user_id FROM team_members WHERE team_id = ?')
    .all(teamId)
    .map((row) => row.user_id);
}

module.exports = { isMember, memberIds };
