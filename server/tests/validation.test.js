const { request, app, createUser, auth, connect } = require('./helpers');

describe('Input checks (NFR1)', () => {
  let alice;
  let brian;
  let teamId;

  beforeAll(async () => {
    alice = await createUser('Checker');
    brian = await createUser('Partner');
    await connect(alice, brian);
    const team = await request(app).post('/api/teams').set(auth(alice)).send({ name: 'Team', memberIds: [brian.id] });
    teamId = team.body.team.id;
  });

  test('sign-up refuses values that are not text', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Number', email: 5, password: 'password123', consent: true });

    expect(res.status).toBe(400);
  });

  test('login refuses values that are not text', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: ['a@example.com'], password: 'password123' });
    expect(res.status).toBe(400);
  });

  test('sign-up refuses a name or password that is too long', async () => {
    const longName = await request(app)
      .post('/api/auth/register')
      .send({ name: 'a'.repeat(101), email: 'long@example.com', password: 'password123', consent: true });
    expect(longName.status).toBe(400);

    const longPassword = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Long', email: 'long@example.com', password: 'a'.repeat(73), consent: true });
    expect(longPassword.status).toBe(400);
  });

  test('profile refuses fields and lists that are too long', async () => {
    const education = await request(app).put('/api/profile/me').set(auth(alice)).send({ education: 'a'.repeat(201) });
    expect(education.status).toBe(400);

    const manyInterests = Array.from({ length: 21 }, (_, i) => `Interest ${i}`);
    const interests = await request(app).put('/api/profile/me').set(auth(alice)).send({ interests: manyInterests });
    expect(interests.status).toBe(400);

    const longInterest = await request(app).put('/api/profile/me').set(auth(alice)).send({ interests: ['a'.repeat(51)] });
    expect(longInterest.status).toBe(400);
  });

  test('a skill name that is too long is refused', async () => {
    const res = await request(app)
      .post('/api/profile/me/skills')
      .set(auth(alice))
      .send({ name: 'a'.repeat(51), category: 'Technology' });

    expect(res.status).toBe(400);
  });

  test('team and project text that is too long is refused', async () => {
    const team = await request(app)
      .post('/api/teams')
      .set(auth(alice))
      .send({ name: 'a'.repeat(101), memberIds: [brian.id] });
    expect(team.status).toBe(400);

    const project = await request(app)
      .post('/api/projects')
      .set(auth(alice))
      .send({ teamId, title: 'a'.repeat(121) });
    expect(project.status).toBe(400);
  });

  test('text at the limit is still accepted', async () => {
    const res = await request(app)
      .post('/api/projects')
      .set(auth(alice))
      .send({ teamId, title: 'a'.repeat(120), description: 'b'.repeat(2000) });

    expect(res.status).toBe(201);
  });
});
