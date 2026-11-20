const { request, app, createUser, auth, connect } = require('./helpers');
const db = require('../src/db');

// Admin accounts cannot be created through sign-up, so make one directly
async function createAdmin(name) {
  const user = await createUser(name);
  db.prepare("UPDATE users SET role = 'admin' WHERE id = ?").run(user.id);
  return user;
}

describe('Admin users management (FR10)', () => {
  let admin;
  let alice;
  let brian;

  beforeAll(async () => {
    admin = await createAdmin('Admin');
    alice = await createUser('Alice');
    brian = await createUser('Brian');
  });

  test('only admins can use the admin routes', async () => {
    const asUser = await request(app).get('/api/admin/users').set(auth(alice));
    expect(asUser.status).toBe(403);

    const asAdmin = await request(app).get('/api/admin/users').set(auth(admin));
    expect(asAdmin.status).toBe(200);
    expect(asAdmin.body.users.map((user) => user.name)).toEqual(expect.arrayContaining(['Alice', 'Brian']));
  });

  test('the sign-up form cannot create an admin', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Sneaky', email: 'sneaky@example.com', password: 'password123', role: 'admin', consent: true });

    expect(res.body.user.role).toBe('youth');
  });

  test('a suspended user is logged out and cannot log in', async () => {
    const res = await request(app).put(`/api/admin/users/${brian.id}/suspend`).set(auth(admin));
    expect(res.status).toBe(200);

    const withOldToken = await request(app).get('/api/auth/me').set(auth(brian));
    expect(withOldToken.status).toBe(403);

    const login = await request(app).post('/api/auth/login').send({ email: brian.email, password: 'password123' });
    expect(login.status).toBe(403);

    const list = await request(app).get('/api/admin/users').set(auth(admin));
    expect(list.body.users.find((user) => user.id === brian.id).suspendedAt).not.toBeNull();
  });

  test('a suspended user is hidden from matches', async () => {
    await request(app).put('/api/profile/me').set(auth(alice)).send({ lookingFor: ['Marketing'] });
    db.prepare("INSERT INTO skills (user_id, name, category) VALUES (?, 'Branding', 'Marketing')").run(brian.id);

    const res = await request(app).get('/api/matches').set(auth(alice));
    expect(res.body.matches.map((match) => match.user.id)).not.toContain(brian.id);
  });

  test('an unsuspended user can log in again', async () => {
    await request(app).put(`/api/admin/users/${brian.id}/unsuspend`).set(auth(admin));

    const login = await request(app).post('/api/auth/login').send({ email: brian.email, password: 'password123' });
    expect(login.status).toBe(200);
  });

  test('admins cannot be suspended', async () => {
    const other = await createAdmin('Helper');
    const res = await request(app).put(`/api/admin/users/${other.id}/suspend`).set(auth(admin));
    expect(res.status).toBe(400);
  });

  test('normal users cannot suspend anyone', async () => {
    const res = await request(app).put(`/api/admin/users/${brian.id}/suspend`).set(auth(alice));
    expect(res.status).toBe(403);
  });
});

describe('Reporting and removing content (FR10)', () => {
  let admin;
  let owner;
  let partner;
  let reporter;
  let mentor;
  let projectId;
  let feedbackId;

  beforeAll(async () => {
    admin = await createAdmin('Moderator');
    owner = await createUser('Owner');
    partner = await createUser('Partner');
    reporter = await createUser('Reporter');
    mentor = await createUser('Mentor', { role: 'mentor' });
    await connect(owner, partner);

    const team = await request(app).post('/api/teams').set(auth(owner)).send({ name: 'Team', memberIds: [partner.id] });
    const project = await request(app)
      .post('/api/projects')
      .set(auth(owner))
      .send({ teamId: team.body.team.id, title: 'Rude project' });
    projectId = project.body.project.id;

    const feedback = await request(app)
      .post(`/api/projects/${projectId}/feedback`)
      .set(auth(mentor))
      .send({ comment: 'An unkind comment' });
    feedbackId = feedback.body.feedback[0].id;
  });

  test('a user reports a project', async () => {
    const res = await request(app)
      .post('/api/reports')
      .set(auth(reporter))
      .send({ contentType: 'project', contentId: projectId, reason: 'Offensive title' });

    expect(res.status).toBe(201);
  });

  test('a report needs a reason and content that exists', async () => {
    const noReason = await request(app)
      .post('/api/reports')
      .set(auth(reporter))
      .send({ contentType: 'feedback', contentId: feedbackId });
    expect(noReason.status).toBe(400);

    const missing = await request(app)
      .post('/api/reports')
      .set(auth(reporter))
      .send({ contentType: 'project', contentId: 9999, reason: 'Spam' });
    expect(missing.status).toBe(404);

    const wrongType = await request(app)
      .post('/api/reports')
      .set(auth(reporter))
      .send({ contentType: 'user', contentId: owner.id, reason: 'Spam' });
    expect(wrongType.status).toBe(400);
  });

  test('the same user cannot report the same content twice', async () => {
    const res = await request(app)
      .post('/api/reports')
      .set(auth(reporter))
      .send({ contentType: 'project', contentId: projectId, reason: 'Again' });

    expect(res.status).toBe(409);
  });

  test('the admin sees open reports with the reported content', async () => {
    await request(app)
      .post('/api/reports')
      .set(auth(partner))
      .send({ contentType: 'feedback', contentId: feedbackId, reason: 'Not helpful and unkind' });

    const res = await request(app).get('/api/admin/reports').set(auth(admin));

    expect(res.body.reports).toHaveLength(2);
    const projectReport = res.body.reports.find((report) => report.contentType === 'project');
    expect(projectReport.reporterName).toBe('Reporter');
    expect(projectReport.content.title).toBe('Rude project');

    const feedbackReport = res.body.reports.find((report) => report.contentType === 'feedback');
    expect(feedbackReport.content.comment).toBe('An unkind comment');
    expect(feedbackReport.content.authorName).toBe('Mentor');
  });

  test('normal users cannot see reports', async () => {
    const res = await request(app).get('/api/admin/reports').set(auth(reporter));
    expect(res.status).toBe(403);
  });

  test('the admin dismisses a report and the content stays', async () => {
    const list = await request(app).get('/api/admin/reports').set(auth(admin));
    const feedbackReport = list.body.reports.find((report) => report.contentType === 'feedback');

    const res = await request(app).put(`/api/admin/reports/${feedbackReport.id}/dismiss`).set(auth(admin));
    expect(res.status).toBe(200);

    const project = await request(app).get(`/api/projects/${projectId}`).set(auth(owner));
    expect(project.body.project.feedback).toHaveLength(1);
  });

  test('the admin removes reported content', async () => {
    const list = await request(app).get('/api/admin/reports').set(auth(admin));
    expect(list.body.reports).toHaveLength(1);

    const res = await request(app).put(`/api/admin/reports/${list.body.reports[0].id}/remove`).set(auth(admin));
    expect(res.status).toBe(200);

    const project = await request(app).get(`/api/projects/${projectId}`).set(auth(owner));
    expect(project.status).toBe(404);

    const open = await request(app).get('/api/admin/reports').set(auth(admin));
    expect(open.body.reports).toHaveLength(0);

    const all = await request(app).get('/api/admin/reports?status=all').set(auth(admin));
    expect(all.body.reports.map((report) => report.status).sort()).toEqual(['dismissed', 'removed']);
  });

  test('a closed report cannot be answered again', async () => {
    const all = await request(app).get('/api/admin/reports?status=all').set(auth(admin));
    const res = await request(app).put(`/api/admin/reports/${all.body.reports[0].id}/dismiss`).set(auth(admin));
    expect(res.status).toBe(404);
  });
});
