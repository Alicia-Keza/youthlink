const { request, app, createUser, auth, connect } = require('./helpers');

async function notificationsOf(user) {
  const res = await request(app).get('/api/notifications').set(auth(user));
  return res.body;
}

describe('Notifications (FR9)', () => {
  let alice;
  let brian;
  let carol;
  let mentor;

  beforeAll(async () => {
    alice = await createUser('Alice');
    brian = await createUser('Brian');
    carol = await createUser('Carol');
    mentor = await createUser('Martha', { role: 'mentor' });
  });

  test('a new user has no notifications', async () => {
    const data = await notificationsOf(alice);

    expect(data.notifications).toEqual([]);
    expect(data.unread).toBe(0);
  });

  test('the receiver is notified about a connection request', async () => {
    await request(app).post('/api/connections').set(auth(alice)).send({ userId: brian.id });

    const data = await notificationsOf(brian);
    expect(data.unread).toBe(1);
    expect(data.notifications[0].text).toBe('Alice wants to connect with you');
    expect(data.notifications[0].link).toBe('/connections');
  });

  test('the sender is notified when the request is accepted', async () => {
    const list = await request(app).get('/api/connections').set(auth(brian));
    await request(app).put(`/api/connections/${list.body.incoming[0].id}/accept`).set(auth(brian));

    const data = await notificationsOf(alice);
    expect(data.notifications[0].text).toBe('Brian accepted your connection request');
  });

  test('members are notified when they are added to a team', async () => {
    const team = await request(app)
      .post('/api/teams')
      .set(auth(alice))
      .send({ name: 'Farm Connect', memberIds: [brian.id] });

    const data = await notificationsOf(brian);
    expect(data.notifications[0].text).toBe('Alice added you to the team Farm Connect');
    expect(data.notifications[0].link).toBe(`/teams/${team.body.team.id}`);

    // The person who created the team is not notified about their own action
    const creator = await notificationsOf(alice);
    expect(creator.notifications[0].type).not.toBe('team');
  });

  test('the receiver is notified about a new message', async () => {
    await request(app).post(`/api/messages/${alice.id}`).set(auth(brian)).send({ body: 'Hello' });

    const data = await notificationsOf(alice);
    expect(data.notifications[0].text).toBe('New message from Brian');
    expect(data.notifications[0].link).toBe(`/messages/${brian.id}`);
  });

  test('the mentor and the team are notified about mentorship', async () => {
    const teams = await request(app).get('/api/teams').set(auth(alice));
    const teamId = teams.body.teams[0].id;

    const sent = await request(app).post('/api/mentorship').set(auth(alice)).send({ teamId, mentorId: mentor.id });
    const mentorData = await notificationsOf(mentor);
    expect(mentorData.notifications[0].text).toBe('The team Farm Connect asked you to be their mentor');

    await request(app).put(`/api/mentorship/${sent.body.request.id}/accept`).set(auth(mentor));
    const teamData = await notificationsOf(brian);
    expect(teamData.notifications[0].text).toBe('Martha accepted to mentor your team');
  });

  test('the team is notified about feedback on a project', async () => {
    const teams = await request(app).get('/api/teams').set(auth(alice));
    const project = await request(app)
      .post('/api/projects')
      .set(auth(alice))
      .send({ teamId: teams.body.teams[0].id, title: 'Market app' });

    await request(app)
      .post(`/api/projects/${project.body.project.id}/feedback`)
      .set(auth(mentor))
      .send({ comment: 'Good start' });

    const data = await notificationsOf(brian);
    expect(data.notifications[0].text).toBe('Martha gave feedback on Market app');
  });

  test('a notification can be marked as read', async () => {
    const before = await notificationsOf(brian);
    const res = await request(app).put(`/api/notifications/${before.notifications[0].id}/read`).set(auth(brian));
    expect(res.status).toBe(200);

    const after = await notificationsOf(brian);
    expect(after.unread).toBe(before.unread - 1);
    expect(after.notifications[0].readAt).not.toBeNull();
  });

  test('a user cannot mark the notification of someone else', async () => {
    const data = await notificationsOf(brian);
    const res = await request(app).put(`/api/notifications/${data.notifications[1].id}/read`).set(auth(carol));
    expect(res.status).toBe(404);
  });

  test('all notifications can be marked as read at once', async () => {
    const res = await request(app).put('/api/notifications/read-all').set(auth(brian));
    expect(res.status).toBe(200);

    const data = await notificationsOf(brian);
    expect(data.unread).toBe(0);
  });
});
