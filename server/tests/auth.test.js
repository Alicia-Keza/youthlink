const { request, app, createUser, auth } = require('./helpers');
const db = require('../src/db');

describe('Registration and login (FR1)', () => {
  test('registers a new user and returns a token', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Alice', email: 'alice@example.com', password: 'password123', consent: true });

    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe('alice@example.com');
    expect(res.body.user.role).toBe('youth');
  });

  test('rejects an email that is already registered', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Alice Two', email: 'alice@example.com', password: 'password123', consent: true });

    expect(res.status).toBe(409);
  });

  test('rejects registration when a field is missing', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'No Password', email: 'nopassword@example.com', consent: true });

    expect(res.status).toBe(400);
  });

  test('stores the password as a hash (NFR1)', () => {
    const row = db.prepare('SELECT password_hash FROM users WHERE email = ?').get('alice@example.com');
    expect(row.password_hash).not.toBe('password123');
  });

  test('logs in with the correct email and password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'alice@example.com', password: 'password123' });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  test('rejects a wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'alice@example.com', password: 'wrong-password' });

    expect(res.status).toBe(401);
  });

  test('protected routes need a token', async () => {
    const withoutToken = await request(app).get('/api/auth/me');
    expect(withoutToken.status).toBe(401);

    const user = await createUser('Brian');
    const withToken = await request(app).get('/api/auth/me').set(auth(user));
    expect(withToken.status).toBe(200);
    expect(withToken.body.user.name).toBe('Brian');
  });
});

describe('Consent and account deletion (NFR5)', () => {
  test('rejects registration without consent', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Carol', email: 'carol@example.com', password: 'password123' });

    expect(res.status).toBe(400);
  });

  test('does not delete the account with a wrong password', async () => {
    const user = await createUser('Daniel');
    const res = await request(app).delete('/api/auth/me').set(auth(user)).send({ password: 'wrong-password' });

    expect(res.status).toBe(401);
  });

  test('deletes the account and its data', async () => {
    const user = await createUser('Esther');
    const res = await request(app).delete('/api/auth/me').set(auth(user)).send({ password: 'password123' });
    expect(res.status).toBe(200);

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: user.email, password: 'password123' });
    expect(login.status).toBe(401);

    const profile = db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(user.id);
    expect(profile).toBeUndefined();
  });
});
