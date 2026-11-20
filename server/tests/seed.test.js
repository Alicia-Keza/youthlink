const { request, app } = require('./helpers');
const db = require('../src/db');
const { seedDemoData } = require('../src/seed');

describe('Demo data', () => {
  test('adds the demo accounts, team and project', () => {
    const total = seedDemoData();

    const users = db.prepare('SELECT COUNT(*) AS count FROM users').get().count;
    expect(users).toBe(total);
    expect(db.prepare("SELECT role FROM users WHERE email = 'admin@example.com'").get().role).toBe('admin');
    expect(db.prepare("SELECT name FROM teams").get().name).toBe('Farm Connect');
    expect(db.prepare('SELECT COUNT(*) AS count FROM projects').get().count).toBe(1);
  });

  test('the demo accounts can log in with the demo password', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'eric@example.com', password: 'password123' });
    expect(res.status).toBe(200);
  });

  test('running it again does not add the data twice', () => {
    const total = seedDemoData();
    expect(db.prepare('SELECT COUNT(*) AS count FROM users').get().count).toBe(total);
  });
});
