const db = require('./db');
const { toList } = require('./lists');

function getSkills(userId) {
  return db.prepare('SELECT id, name, category FROM skills WHERE user_id = ? ORDER BY name').all(userId);
}

// Builds the profile shown to other users. The email is left out on purpose.
function getProfile(userId) {
  const row = db
    .prepare(
      `SELECT u.id, u.name, u.role, p.bio, p.education, p.location, p.interests, p.looking_for
       FROM users u JOIN profiles p ON p.user_id = u.id
       WHERE u.id = ?`
    )
    .get(userId);

  if (!row) return null;

  const profile = {
    id: row.id,
    name: row.name,
    role: row.role,
    bio: row.bio,
    education: row.education,
    location: row.location,
    interests: toList(row.interests),
    lookingFor: toList(row.looking_for),
    skills: getSkills(userId),
  };

  // Mentors and investors also have their expertise and focus areas
  if (row.role === 'mentor' || row.role === 'investor') {
    const extra = db.prepare('SELECT expertise, focus_areas FROM mentor_profiles WHERE user_id = ?').get(userId);
    profile.expertise = extra ? extra.expertise : '';
    profile.focusAreas = toList(extra ? extra.focus_areas : '');
  }

  return profile;
}

module.exports = { getProfile, getSkills };
