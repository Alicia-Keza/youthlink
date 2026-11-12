const { request, app, createUser, auth } = require('./helpers');

describe('Profile and skills (FR2)', () => {
  let alice;
  let brian;

  beforeAll(async () => {
    alice = await createUser('Alice');
    brian = await createUser('Brian');
  });

  test('a new user starts with an empty profile', async () => {
    const res = await request(app).get('/api/profile/me').set(auth(alice));

    expect(res.status).toBe(200);
    expect(res.body.profile.name).toBe('Alice');
    expect(res.body.profile.skills).toEqual([]);
    expect(res.body.profile.interests).toEqual([]);
  });

  test('updates the profile', async () => {
    const res = await request(app)
      .put('/api/profile/me')
      .set(auth(alice))
      .send({
        bio: 'I like building websites',
        education: 'BSc Software Engineering',
        location: 'Kigali',
        interests: ['Education', ' Health '],
        lookingFor: ['Marketing'],
      });

    expect(res.status).toBe(200);
    expect(res.body.profile.bio).toBe('I like building websites');
    expect(res.body.profile.interests).toEqual(['Education', 'Health']);
    expect(res.body.profile.lookingFor).toEqual(['Marketing']);
  });

  test('ignores unknown skill areas in looking for', async () => {
    const res = await request(app)
      .put('/api/profile/me')
      .set(auth(alice))
      .send({ lookingFor: ['Marketing', 'Cooking'] });

    expect(res.body.profile.lookingFor).toEqual(['Marketing']);
  });

  test('rejects a bio that is too long', async () => {
    const res = await request(app)
      .put('/api/profile/me')
      .set(auth(alice))
      .send({ bio: 'a'.repeat(501) });

    expect(res.status).toBe(400);
  });

  test('adds a skill', async () => {
    const res = await request(app)
      .post('/api/profile/me/skills')
      .set(auth(alice))
      .send({ name: 'JavaScript', category: 'Technology' });

    expect(res.status).toBe(201);
    expect(res.body.skill.name).toBe('JavaScript');
  });

  test('rejects the same skill twice', async () => {
    const res = await request(app)
      .post('/api/profile/me/skills')
      .set(auth(alice))
      .send({ name: 'javascript', category: 'Technology' });

    expect(res.status).toBe(409);
  });

  test('rejects a skill with an unknown category', async () => {
    const res = await request(app)
      .post('/api/profile/me/skills')
      .set(auth(alice))
      .send({ name: 'Cooking', category: 'Food' });

    expect(res.status).toBe(400);
  });

  test('another user can view the profile but not the email', async () => {
    const res = await request(app).get(`/api/profile/${alice.id}`).set(auth(brian));

    expect(res.status).toBe(200);
    expect(res.body.profile.skills).toHaveLength(1);
    expect(res.body.profile.email).toBeUndefined();
  });

  test('removes a skill', async () => {
    const profile = await request(app).get('/api/profile/me').set(auth(alice));
    const skillId = profile.body.profile.skills[0].id;

    const res = await request(app).delete(`/api/profile/me/skills/${skillId}`).set(auth(alice));
    expect(res.status).toBe(200);

    const after = await request(app).get('/api/profile/me').set(auth(alice));
    expect(after.body.profile.skills).toEqual([]);
  });

  test('a user cannot remove the skill of someone else', async () => {
    const added = await request(app)
      .post('/api/profile/me/skills')
      .set(auth(alice))
      .send({ name: 'React', category: 'Technology' });

    const res = await request(app).delete(`/api/profile/me/skills/${added.body.skill.id}`).set(auth(brian));
    expect(res.status).toBe(404);
  });
});
