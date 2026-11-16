const { request, app, createUser, auth, connect } = require('./helpers');

describe('Mentorship requests (FR7)', () => {
  let alice;
  let brian;
  let carol;
  let mentor;
  let otherMentor;
  let teamId;
  let requestId;

  beforeAll(async () => {
    alice = await createUser('Alice');
    brian = await createUser('Brian');
    carol = await createUser('Carol');
    mentor = await createUser('Martha', { role: 'mentor' });
    otherMentor = await createUser('Moses', { role: 'mentor' });
    await connect(alice, brian);

    const team = await request(app)
      .post('/api/teams')
      .set(auth(alice))
      .send({ name: 'Farm Connect', memberIds: [brian.id] });
    teamId = team.body.team.id;

    await request(app).post('/api/projects').set(auth(alice)).send({ teamId, title: 'Farmers market app' });
    await request(app)
      .put('/api/profile/me')
      .set(auth(mentor))
      .send({ expertise: 'Business strategy', focusAreas: ['Agriculture'] });
  });

  test('lists mentors with their expertise', async () => {
    const res = await request(app).get('/api/mentorship/mentors').set(auth(alice));

    expect(res.status).toBe(200);
    expect(res.body.mentors.map((item) => item.name)).toEqual(['Martha', 'Moses']);
    expect(res.body.mentors[0].expertise).toBe('Business strategy');
  });

  test('a team member sends a mentorship request', async () => {
    const res = await request(app)
      .post('/api/mentorship')
      .set(auth(alice))
      .send({ teamId, mentorId: mentor.id, message: 'We need help with our business plan' });

    expect(res.status).toBe(201);
    expect(res.body.request.status).toBe('pending');
    requestId = res.body.request.id;
  });

  test('a team cannot ask the same mentor twice', async () => {
    const res = await request(app).post('/api/mentorship').set(auth(brian)).send({ teamId, mentorId: mentor.id });
    expect(res.status).toBe(409);
  });

  test('only team members can request a mentor for a team', async () => {
    const res = await request(app).post('/api/mentorship').set(auth(carol)).send({ teamId, mentorId: mentor.id });
    expect(res.status).toBe(403);
  });

  test('a request can only be sent to a mentor', async () => {
    const res = await request(app).post('/api/mentorship').set(auth(alice)).send({ teamId, mentorId: carol.id });
    expect(res.status).toBe(404);
  });

  test('the team sees its requests', async () => {
    const res = await request(app).get(`/api/mentorship/team/${teamId}`).set(auth(brian));

    expect(res.body.requests).toHaveLength(1);
    expect(res.body.requests[0].mentorName).toBe('Martha');
    expect(res.body.requests[0].status).toBe('pending');

    const outsider = await request(app).get(`/api/mentorship/team/${teamId}`).set(auth(carol));
    expect(outsider.status).toBe(403);
  });

  test('the mentor sees the request with the projects of the team', async () => {
    const res = await request(app).get('/api/mentorship/requests').set(auth(mentor));

    expect(res.body.pending).toHaveLength(1);
    expect(res.body.pending[0].teamName).toBe('Farm Connect');
    expect(res.body.pending[0].message).toBe('We need help with our business plan');
    expect(res.body.pending[0].projects[0].title).toBe('Farmers market app');
    expect(res.body.accepted).toHaveLength(0);
  });

  test('only the mentor who received the request can answer it', async () => {
    const byOtherMentor = await request(app).put(`/api/mentorship/${requestId}/accept`).set(auth(otherMentor));
    expect(byOtherMentor.status).toBe(404);

    const byTeam = await request(app).put(`/api/mentorship/${requestId}/accept`).set(auth(alice));
    expect(byTeam.status).toBe(404);
  });

  test('the mentor accepts the request', async () => {
    const res = await request(app).put(`/api/mentorship/${requestId}/accept`).set(auth(mentor));
    expect(res.status).toBe(200);

    const dashboard = await request(app).get('/api/mentorship/requests').set(auth(mentor));
    expect(dashboard.body.pending).toHaveLength(0);
    expect(dashboard.body.accepted).toHaveLength(1);

    const team = await request(app).get(`/api/mentorship/team/${teamId}`).set(auth(alice));
    expect(team.body.requests[0].status).toBe('accepted');
  });

  test('a declined request can be sent again', async () => {
    const sent = await request(app).post('/api/mentorship').set(auth(alice)).send({ teamId, mentorId: otherMentor.id });
    const declined = await request(app).put(`/api/mentorship/${sent.body.request.id}/decline`).set(auth(otherMentor));
    expect(declined.status).toBe(200);

    const again = await request(app).post('/api/mentorship').set(auth(alice)).send({ teamId, mentorId: otherMentor.id });
    expect(again.status).toBe(201);
  });
});
