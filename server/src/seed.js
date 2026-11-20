// Demo data: youth users, a mentor, an investor, an admin, a team and a project.
// Run by hand with: npm run seed (this deletes all existing data first).
// The server also calls seedDemoData when it starts with an empty database and
// SEED_IF_EMPTY=true, so the free hosted version always has data to try.
const bcrypt = require('bcryptjs');
const db = require('./db');

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

// Demo mentor and investor
const supporters = [
  {
    name: 'Jean Paul Niyonzima',
    email: 'mentor@example.com',
    role: 'mentor',
    bio: 'I have run a small business for twelve years and enjoy helping young founders.',
    expertise: 'Business strategy and sales',
    focusAreas: ['Agriculture', 'Retail'],
  },
  {
    name: 'Aline Uwimana',
    email: 'investor@example.com',
    role: 'investor',
    bio: 'Angel investor looking for early projects led by young people.',
    expertise: 'Early stage investment',
    focusAreas: ['Agriculture', 'Education', 'Health'],
  },
];

// [requester, receiver, status]
const connections = [
  ['eric@example.com', 'diane@example.com', 'accepted'],
  ['patrick@example.com', 'eric@example.com', 'accepted'],
  ['grace@example.com', 'eric@example.com', 'pending'],
];

// Deletes everything and adds the demo data. Returns the number of users added.
function seedDemoData() {
  db.exec(`
    DELETE FROM reports;
    DELETE FROM notifications;
    DELETE FROM messages;
    DELETE FROM feedback;
    DELETE FROM project_interests;
    DELETE FROM mentorship_requests;
    DELETE FROM projects;
    DELETE FROM mentor_profiles;
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

  for (const person of supporters) {
    const result = db
      .prepare("INSERT INTO users (name, email, password_hash, role, consent_at) VALUES (?, ?, ?, ?, datetime('now'))")
      .run(person.name, person.email, passwordHash, person.role);
    const userId = result.lastInsertRowid;
    ids[person.email] = userId;

    db.prepare('INSERT INTO profiles (user_id, bio, location) VALUES (?, ?, ?)').run(userId, person.bio, 'Kigali');
    db.prepare('INSERT INTO mentor_profiles (user_id, expertise, focus_areas) VALUES (?, ?, ?)').run(
      userId,
      person.expertise,
      person.focusAreas.join(',')
    );
  }

  // Administrator account. Admins cannot sign up, so this is the only way to get one for the demo.
  const admin = db
    .prepare("INSERT INTO users (name, email, password_hash, role, consent_at) VALUES (?, ?, ?, 'admin', datetime('now'))")
    .run('YouthLink Admin', 'admin@example.com', passwordHash);
  db.prepare('INSERT INTO profiles (user_id) VALUES (?)').run(admin.lastInsertRowid);

  // A demo team with a project and a mentorship request waiting for an answer
  const team = db
    .prepare('INSERT INTO teams (name, description, created_by) VALUES (?, ?, ?)')
    .run('Farm Connect', 'Linking small farmers in Rwanda to buyers', ids['eric@example.com']);
  const teamId = team.lastInsertRowid;

  for (const email of ['eric@example.com', 'diane@example.com', 'patrick@example.com']) {
    db.prepare('INSERT INTO team_members (team_id, user_id) VALUES (?, ?)').run(teamId, ids[email]);
  }

  db.prepare('INSERT INTO projects (team_id, title, description, stage) VALUES (?, ?, ?, ?)').run(
    teamId,
    'Farmers market app',
    'A web app where farmers list their harvest and buyers order directly.',
    'Planning'
  );

  db.prepare('INSERT INTO mentorship_requests (team_id, mentor_id, message) VALUES (?, ?, ?)').run(
    teamId,
    ids['mentor@example.com'],
    'We would like advice on how to reach our first buyers.'
  );

  return users.length + supporters.length + 1;
}

if (require.main === module) {
  if (process.env.NODE_ENV === 'production') {
    console.error('The seed script deletes all data, so it cannot be run by hand in production');
    process.exit(1);
  }
  const total = seedDemoData();
  console.log(`Added ${total} demo users (including admin@example.com), 1 team and 1 project.`);
  console.log(`Password for all of them: ${PASSWORD}`);
}

module.exports = { seedDemoData };
