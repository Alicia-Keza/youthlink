const { request, app, createUser, auth, connect } = require('./helpers');

describe('Team formation (FR5)', () => {
  let alice;
  let brian;
  let carol;
  let diana;
  let teamId;

  beforeAll(async () => {
    alice = await createUser('Alice');
    brian = await createUser('Brian');
    carol = await createUser('Carol');
    diana = await createUser('Diana');

    await connect(alice, brian);
    await connect(carol, alice);

    await request(app)
      .post('/api/profile/me/skills')
      .set(auth(brian))
      .send({ name: 'Branding', category: 'Marketing' });
  });

  test('creates a team with a connected user', async () => {
    const res = await request(app)
      .post('/api/teams')
      .set(auth(alice))
      .send({ name: 'Farm Connect', description: 'Linking farmers to buyers', memberIds: [brian.id] });

    expect(res.status).toBe(201);
    expect(res.body.team.members.map((member) => member.name)).toEqual(['Alice', 'Brian']);
    teamId = res.body.team.id;
  });

  test('a team needs a name and at least one other member', async () => {
    const noName = await request(app).post('/api/teams').set(auth(alice)).send({ memberIds: [brian.id] });
    expect(noName.status).toBe(400);

    const noMembers = await request(app).post('/api/teams').set(auth(alice)).send({ name: 'Solo', memberIds: [] });
    expect(noMembers.status).toBe(400);
  });

  test('cannot form a team with someone who is not a connection', async () => {
    const res = await request(app)
      .post('/api/teams')
      .set(auth(alice))
      .send({ name: 'Strangers', memberIds: [diana.id] });

    expect(res.status).toBe(400);
  });

  test('lists the teams of each member', async () => {
    const res = await request(app).get('/api/teams').set(auth(brian));

    expect(res.body.teams).toHaveLength(1);
    expect(res.body.teams[0].name).toBe('Farm Connect');
    expect(res.body.teams[0].memberCount).toBe(2);
  });

  test('team details include the skills of the members', async () => {
    const res = await request(app).get(`/api/teams/${teamId}`).set(auth(alice));

    expect(res.status).toBe(200);
    const brianInTeam = res.body.team.members.find((member) => member.id === brian.id);
    expect(brianInTeam.skills[0].category).toBe('Marketing');
  });

  test('only members can view a team', async () => {
    const res = await request(app).get(`/api/teams/${teamId}`).set(auth(diana));
    expect(res.status).toBe(403);
  });

  test('a member can add one of their connections', async () => {
    const res = await request(app).post(`/api/teams/${teamId}/members`).set(auth(alice)).send({ userId: carol.id });

    expect(res.status).toBe(201);
    expect(res.body.team.members).toHaveLength(3);
  });

  test('cannot add the same person twice or a person who is not a connection', async () => {
    const twice = await request(app).post(`/api/teams/${teamId}/members`).set(auth(alice)).send({ userId: carol.id });
    expect(twice.status).toBe(409);

    const stranger = await request(app).post(`/api/teams/${teamId}/members`).set(auth(alice)).send({ userId: diana.id });
    expect(stranger.status).toBe(400);
  });

  test('a member can leave the team', async () => {
    const res = await request(app).delete(`/api/teams/${teamId}/members/me`).set(auth(carol));
    expect(res.status).toBe(200);

    const teams = await request(app).get('/api/teams').set(auth(carol));
    expect(teams.body.teams).toHaveLength(0);
  });

  test('a member who deletes their account is removed from the team', async () => {
    await request(app).delete('/api/auth/me').set(auth(brian)).send({ password: 'password123' });

    const res = await request(app).get(`/api/teams/${teamId}`).set(auth(alice));
    expect(res.body.team.members.map((member) => member.name)).toEqual(['Alice']);
  });
});
