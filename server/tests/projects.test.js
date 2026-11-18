const { request, app, createUser, auth, connect } = require('./helpers');

describe('Project management (FR6)', () => {
  let alice;
  let brian;
  let carol;
  let teamId;
  let projectId;

  beforeAll(async () => {
    alice = await createUser('Alice');
    brian = await createUser('Brian');
    carol = await createUser('Carol');
    await connect(alice, brian);

    const team = await request(app)
      .post('/api/teams')
      .set(auth(alice))
      .send({ name: 'Farm Connect', memberIds: [brian.id] });
    teamId = team.body.team.id;
  });

  test('a team member creates a project', async () => {
    const res = await request(app)
      .post('/api/projects')
      .set(auth(alice))
      .send({ teamId, title: 'Farmers market app', description: 'Helps farmers find buyers' });

    expect(res.status).toBe(201);
    expect(res.body.project.title).toBe('Farmers market app');
    expect(res.body.project.stage).toBe('Idea');
    expect(res.body.project.teamName).toBe('Farm Connect');
    projectId = res.body.project.id;
  });

  test('a project needs a title and a valid stage', async () => {
    const noTitle = await request(app).post('/api/projects').set(auth(alice)).send({ teamId });
    expect(noTitle.status).toBe(400);

    const badStage = await request(app)
      .post('/api/projects')
      .set(auth(alice))
      .send({ teamId, title: 'Another idea', stage: 'Finished' });
    expect(badStage.status).toBe(400);
  });

  test('only team members can create a project for a team', async () => {
    const res = await request(app)
      .post('/api/projects')
      .set(auth(carol))
      .send({ teamId, title: 'Not my team' });

    expect(res.status).toBe(403);
  });

  test('all logged in users can browse projects', async () => {
    const res = await request(app).get('/api/projects').set(auth(carol));

    expect(res.status).toBe(200);
    expect(res.body.projects).toHaveLength(1);
    expect(res.body.projects[0].title).toBe('Farmers market app');
  });

  test('projects can be filtered by stage and by team', async () => {
    const idea = await request(app).get('/api/projects?stage=Idea').set(auth(carol));
    expect(idea.body.projects).toHaveLength(1);

    const launched = await request(app).get('/api/projects?stage=Launched').set(auth(carol));
    expect(launched.body.projects).toHaveLength(0);

    const byTeam = await request(app).get(`/api/projects?teamId=${teamId}`).set(auth(carol));
    expect(byTeam.body.projects).toHaveLength(1);
  });

  test('project details show whether the user can edit it', async () => {
    const member = await request(app).get(`/api/projects/${projectId}`).set(auth(brian));
    expect(member.body.project.canEdit).toBe(true);

    const visitor = await request(app).get(`/api/projects/${projectId}`).set(auth(carol));
    expect(visitor.body.project.canEdit).toBe(false);
  });

  test('a team member edits the project', async () => {
    const res = await request(app)
      .put(`/api/projects/${projectId}`)
      .set(auth(brian))
      .send({ title: 'Farmers market platform', description: 'Web and SMS' });

    expect(res.status).toBe(200);
    expect(res.body.project.title).toBe('Farmers market platform');
    expect(res.body.project.description).toBe('Web and SMS');
  });

  test('a team member updates the stage', async () => {
    const res = await request(app)
      .put(`/api/projects/${projectId}/stage`)
      .set(auth(alice))
      .send({ stage: 'In development' });

    expect(res.status).toBe(200);
    expect(res.body.project.stage).toBe('In development');

    const invalid = await request(app)
      .put(`/api/projects/${projectId}/stage`)
      .set(auth(alice))
      .send({ stage: 'Finished' });
    expect(invalid.status).toBe(400);
  });

  test('other users cannot change the project', async () => {
    const edit = await request(app)
      .put(`/api/projects/${projectId}`)
      .set(auth(carol))
      .send({ title: 'Changed by a stranger' });
    expect(edit.status).toBe(403);

    const stage = await request(app)
      .put(`/api/projects/${projectId}/stage`)
      .set(auth(carol))
      .send({ stage: 'Launched' });
    expect(stage.status).toBe(403);
  });

  test('projects are removed when the team is removed', async () => {
    await request(app).delete(`/api/teams/${teamId}/members/me`).set(auth(alice));
    await request(app).delete(`/api/teams/${teamId}/members/me`).set(auth(brian));

    const res = await request(app).get('/api/projects').set(auth(carol));
    expect(res.body.projects).toHaveLength(0);
  });
});

describe('Investor interest in a project (FR6)', () => {
  let diana;
  let eric;
  let investor;
  let projectId;

  beforeAll(async () => {
    diana = await createUser('Diana');
    eric = await createUser('Eric');
    investor = await createUser('Ivan', { role: 'investor' });
    await connect(diana, eric);

    const team = await request(app)
      .post('/api/teams')
      .set(auth(diana))
      .send({ name: 'Clean Water', memberIds: [eric.id] });
    const project = await request(app)
      .post('/api/projects')
      .set(auth(diana))
      .send({ teamId: team.body.team.id, title: 'Water filters' });
    projectId = project.body.project.id;
  });

  test('an investor shows interest in a project', async () => {
    const res = await request(app).post(`/api/projects/${projectId}/interest`).set(auth(investor));
    expect(res.status).toBe(201);

    const details = await request(app).get(`/api/projects/${projectId}`).set(auth(investor));
    expect(details.body.project.interested).toBe(true);
    expect(details.body.project.interestCount).toBe(1);
  });

  test('showing interest twice is only counted once', async () => {
    await request(app).post(`/api/projects/${projectId}/interest`).set(auth(investor));

    const details = await request(app).get(`/api/projects/${projectId}`).set(auth(investor));
    expect(details.body.project.interestCount).toBe(1);
  });

  test('only investors can show interest', async () => {
    const res = await request(app).post(`/api/projects/${projectId}/interest`).set(auth(eric));
    expect(res.status).toBe(403);
  });

  test('the team sees which investors are interested, other users only see the count', async () => {
    const member = await request(app).get(`/api/projects/${projectId}`).set(auth(diana));
    expect(member.body.project.investors).toEqual([{ id: investor.id, name: 'Ivan' }]);

    const visitor = await request(app).get(`/api/projects/${projectId}`).set(auth(investor));
    expect(visitor.body.project.investors).toBeUndefined();
  });

  test('an investor can remove their interest', async () => {
    const res = await request(app).delete(`/api/projects/${projectId}/interest`).set(auth(investor));
    expect(res.status).toBe(200);

    const details = await request(app).get(`/api/projects/${projectId}`).set(auth(investor));
    expect(details.body.project.interested).toBe(false);
    expect(details.body.project.interestCount).toBe(0);
  });
});

describe('Feedback on a project (FR6, FR7)', () => {
  let frank;
  let grace;
  let mentor;
  let projectId;

  beforeAll(async () => {
    frank = await createUser('Frank');
    grace = await createUser('Grace');
    mentor = await createUser('Martha', { role: 'mentor' });
    await connect(frank, grace);

    const team = await request(app)
      .post('/api/teams')
      .set(auth(frank))
      .send({ name: 'Study Buddy', memberIds: [grace.id] });
    const project = await request(app)
      .post('/api/projects')
      .set(auth(frank))
      .send({ teamId: team.body.team.id, title: 'Revision app' });
    projectId = project.body.project.id;
  });

  test('a mentor gives feedback on a project', async () => {
    const res = await request(app)
      .post(`/api/projects/${projectId}/feedback`)
      .set(auth(mentor))
      .send({ comment: 'Talk to ten students before you build more.' });

    expect(res.status).toBe(201);
    expect(res.body.feedback).toHaveLength(1);
    expect(res.body.feedback[0].authorName).toBe('Martha');
    expect(res.body.feedback[0].authorRole).toBe('mentor');
  });

  test('the team sees the feedback on the project', async () => {
    const res = await request(app).get(`/api/projects/${projectId}`).set(auth(grace));

    expect(res.body.project.feedback).toHaveLength(1);
    expect(res.body.project.feedback[0].comment).toBe('Talk to ten students before you build more.');
  });

  test('feedback cannot be empty', async () => {
    const res = await request(app).post(`/api/projects/${projectId}/feedback`).set(auth(mentor)).send({ comment: '  ' });
    expect(res.status).toBe(400);
  });

  test('youth users cannot give feedback', async () => {
    const res = await request(app)
      .post(`/api/projects/${projectId}/feedback`)
      .set(auth(frank))
      .send({ comment: 'Our own project is great' });

    expect(res.status).toBe(403);
  });
});
