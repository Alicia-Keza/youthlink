// Tests use a database in memory, so the real database is never touched
process.env.DB_FILE = ':memory:';

const request = require('supertest');
const app = require('../src/app');

// Registers a user and returns their id and token
async function createUser(name, extra = {}) {
  const email = `${name.toLowerCase()}@example.com`;
  const res = await request(app)
    .post('/api/auth/register')
    .send({ name, email, password: 'password123', consent: true, ...extra });
  return { id: res.body.user.id, token: res.body.token, email };
}

function auth(user) {
  return { Authorization: `Bearer ${user.token}` };
}

// Makes two users connected: one sends a request and the other accepts it
async function connect(sender, receiver) {
  const res = await request(app).post('/api/connections').set(auth(sender)).send({ userId: receiver.id });
  await request(app).put(`/api/connections/${res.body.connection.id}/accept`).set(auth(receiver));
}

module.exports = { request, app, createUser, auth, connect };
