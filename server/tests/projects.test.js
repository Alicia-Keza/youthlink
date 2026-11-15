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
