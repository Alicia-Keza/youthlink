const { request, app, createUser, auth, connect } = require('./helpers');

describe('In-app messaging (FR8)', () => {
  let alice;
  let brian;
  let carol;

  beforeAll(async () => {
    alice = await createUser('Alice');
    brian = await createUser('Brian');
    carol = await createUser('Carol');
    await connect(alice, brian);
  });

  test('a user sends a message to a connection', async () => {
    const res = await request(app)
      .post(`/api/messages/${brian.id}`)
      .set(auth(alice))
      .send({ body: 'Hi Brian, shall we meet on Friday?' });

    expect(res.status).toBe(201);
    expect(res.body.message.body).toBe('Hi Brian, shall we meet on Friday?');
    expect(res.body.message.senderId).toBe(alice.id);
  });

  test('a message cannot be empty', async () => {
    const res = await request(app).post(`/api/messages/${brian.id}`).set(auth(alice)).send({ body: '   ' });
    expect(res.status).toBe(400);
  });

  test('users who are not connected cannot message each other', async () => {
    const res = await request(app).post(`/api/messages/${carol.id}`).set(auth(alice)).send({ body: 'Hello' });
    expect(res.status).toBe(403);
  });

  test('the receiver sees the conversation with an unread count', async () => {
    const res = await request(app).get('/api/messages').set(auth(brian));

    expect(res.body.conversations).toHaveLength(1);
    expect(res.body.conversations[0].user.name).toBe('Alice');
    expect(res.body.conversations[0].unread).toBe(1);
    expect(res.body.conversations[0].lastMessage.body).toBe('Hi Brian, shall we meet on Friday?');
  });

  test('opening the conversation shows the messages and marks them as read', async () => {
    const res = await request(app).get(`/api/messages/${alice.id}`).set(auth(brian));

    expect(res.status).toBe(200);
    expect(res.body.user.name).toBe('Alice');
    expect(res.body.messages).toHaveLength(1);
    expect(res.body.canSend).toBe(true);

    const list = await request(app).get('/api/messages').set(auth(brian));
    expect(list.body.conversations[0].unread).toBe(0);
  });

  test('messages are shown in the order they were sent', async () => {
    await request(app).post(`/api/messages/${alice.id}`).set(auth(brian)).send({ body: 'Yes, Friday works' });

    const res = await request(app).get(`/api/messages/${brian.id}`).set(auth(alice));
    expect(res.body.messages.map((message) => message.body)).toEqual([
      'Hi Brian, shall we meet on Friday?',
      'Yes, Friday works',
    ]);
  });

  test('other users cannot read the conversation', async () => {
    const res = await request(app).get(`/api/messages/${alice.id}`).set(auth(carol));

    expect(res.body.messages).toHaveLength(0);
    expect(res.body.canSend).toBe(false);
  });
});
