const { request, app, createUser } = require('./helpers');

describe('Login rate limiting (NFR1)', () => {
  let user;

  beforeAll(async () => {
    user = await createUser('Alice');
  });

  test('a correct login still works after a few wrong passwords', async () => {
    for (let i = 0; i < 3; i++) {
      await request(app).post('/api/auth/login').send({ email: user.email, password: 'wrong-password' });
    }

    const res = await request(app).post('/api/auth/login').send({ email: user.email, password: 'password123' });
    expect(res.status).toBe(200);
  });

  test('logins are blocked after 10 wrong passwords', async () => {
    // 3 wrong attempts were already made in the test above
    for (let i = 0; i < 7; i++) {
      const res = await request(app).post('/api/auth/login').send({ email: user.email, password: 'wrong-password' });
      expect(res.status).toBe(401);
    }

    const blocked = await request(app).post('/api/auth/login').send({ email: user.email, password: 'password123' });
    expect(blocked.status).toBe(429);
    expect(blocked.body.error).toMatch(/Too many failed login attempts/);
  });
});

describe('Security headers and request checks (NFR1)', () => {
  test('responses include security headers', async () => {
    const res = await request(app).get('/api/health');

    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-frame-options']).toBe('SAMEORIGIN');
    expect(res.headers['x-powered-by']).toBeUndefined();
  });

  test('broken JSON gets a clear error instead of a server error', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send('{"email": ');

    expect(res.status).toBe(400);
  });

  test('a request that is too large is refused', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'big@example.com', password: 'a'.repeat(200 * 1024) });

    expect(res.status).toBe(413);
  });
});
