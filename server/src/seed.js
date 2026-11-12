// Fills the database with demo users for local testing.
// Run with: npm run seed
const bcrypt = require('bcryptjs');
const db = require('./db');

if (process.env.NODE_ENV === 'production') {
  console.error('The seed script cannot run in production');
  process.exit(1);
}

const PASSWORD = 'password123';

const users = [
  {
    name: 'Eric Mugisha',
    email: 'eric@example.com',
    bio: 'Software developer looking for people with ideas and marketing skills.',
    education: 'BSc Software Engineering',
    interests: ['Education', 'Agriculture'],
    lookingFor: ['Marketing', 'Business'],
    skills: [['JavaScript', 'Technology'], ['Web development', 'Technology']],
  },
  {
    name: 'Diane Uwase',
    email: 'diane@example.com',
    bio: 'I enjoy marketing and growing an audience on social media.',
    education: 'BA Marketing',
    interests: ['Fashion', 'Education'],
    lookingFor: ['Technology', 'Design'],
    skills: [['Social media marketing', 'Marketing'], ['Branding', 'Marketing']],
  },
  {
    name: 'Patrick Nshuti',
    email: 'patrick@example.com',
    bio: 'I have business ideas but I need a team to build them.',
    education: 'BBA Entrepreneurship',
    interests: ['Agriculture', 'Transport'],
    lookingFor: ['Technology', 'Finance'],
    skills: [['Business planning', 'Business'], ['Sales', 'Business']],
  },
  {
    name: 'Grace Ingabire',
    email: 'grace@example.com',
    bio: 'Designer who likes making simple and clear interfaces.',
    education: 'Diploma in Graphic Design',
    interests: ['Fashion', 'Health'],
    lookingFor: ['Technology', 'Marketing'],
    skills: [['UI design', 'Design'], ['Logo design', 'Design']],
  },
  {
    name: 'Samuel Habimana',
    email: 'samuel@example.com',
    bio: 'Accounting graduate interested in helping young businesses manage money.',
    education: 'BSc Accounting',
    interests: ['Agriculture', 'Health'],
    lookingFor: ['Business', 'Technology'],
    skills: [['Bookkeeping', 'Finance'], ['Budgeting', 'Finance']],
  },
  {
    name: 'Claudine Mukamana',
    email: 'claudine@example.com',
    bio: 'I make videos and take photos for small businesses.',
    education: 'Certificate in Film Making',
    interests: ['Fashion', 'Transport'],
    lookingFor: ['Marketing', 'Design'],
    skills: [['Video editing', 'Media'], ['Photography', 'Media']],
  },
];

// [requester, receiver, status]
const connections = [
  ['eric@example.com', 'diane@example.com', 'accepted'],
  ['patrick@example.com', 'eric@example.com', 'accepted'],
  ['grace@example.com', 'eric@example.com', 'pending'],
];

db.exec(`
  DELETE FROM team_members;
  DELETE FROM teams;
  DELETE FROM connections;
  DELETE FROM skills;
  DELETE FROM profiles;
  DELETE FROM users;
`);

const passwordHash = bcrypt.hashSync(PASSWORD, 10);
const ids = {};

for (const user of users) {
  const result = db
    .prepare("INSERT INTO users (name, email, password_hash, role, consent_at) VALUES (?, ?, ?, 'youth', datetime('now'))")
    .run(user.name, user.email, passwordHash);
  const userId = result.lastInsertRowid;
  ids[user.email] = userId;

  db.prepare('INSERT INTO profiles (user_id, bio, education, location, interests, looking_for) VALUES (?, ?, ?, ?, ?, ?)').run(
    userId,
    user.bio,
    user.education,
    'Kigali',
    user.interests.join(','),
    user.lookingFor.join(',')
  );

  for (const [name, category] of user.skills) {
    db.prepare('INSERT INTO skills (user_id, name, category) VALUES (?, ?, ?)').run(userId, name, category);
  }
}

for (const [requester, receiver, status] of connections) {
  db.prepare('INSERT INTO connections (requester_id, receiver_id, status) VALUES (?, ?, ?)').run(
    ids[requester],
    ids[receiver],
    status
  );
}

console.log(`Added ${users.length} demo users. Password for all of them: ${PASSWORD}`);
