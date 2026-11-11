const { request, app, createUser, auth } = require('./helpers');

describe('Connection requests (FR4)', () => {
  let alice;
  let brian;
  let carol;
  let requestId;

  beforeAll(async () => {
    alice = await createUser('Alice');
    brian = await createUser('Brian');
    carol = await createUser('Carol');
  });

  test('sends a connection request', async () => {
    const res = await request(app).post('/api/connections').set(auth(alice)).send({ userId: brian.id });

    expect(res.status).toBe(201);
    expect(res.body.connection.status).toBe('pending');
    requestId = res.body.connection.id;
  });

  test('cannot send a request to yourself', async () => {
    const res = await request(app).post('/api/connections').set(auth(alice)).send({ userId: alice.id });
    expect(res.status).toBe(400);
  });

  test('cannot send a request to a user that does not exist', async () => {
    const res = await request(app).post('/api/connections').set(auth(alice)).send({ userId: 9999 });
    expect(res.status).toBe(404);
  });

  test('cannot send a second request while one is pending', async () => {
    const same = await request(app).post('/api/connections').set(auth(alice)).send({ userId: brian.id });
    expect(same.status).toBe(409);
  });

  test('the request shows as outgoing for the sender and incoming for the receiver', async () => {
    const sender = await request(app).get('/api/connections').set(auth(alice));
    expect(sender.body.outgoing).toHaveLength(1);
    expect(sender.body.outgoing[0].user.name).toBe('Brian');

    const receiver = await request(app).get('/api/connections').set(auth(brian));
    expect(receiver.body.incoming).toHaveLength(1);
    expect(receiver.body.incoming[0].user.name).toBe('Alice');
  });

  test('only the receiver can accept a request', async () => {
    const bySender = await request(app).put(`/api/connections/${requestId}/accept`).set(auth(alice));
    expect(bySender.status).toBe(404);

    const byOther = await request(app).put(`/api/connections/${requestId}/accept`).set(auth(carol));
    expect(byOther.status).toBe(404);
  });

  test('accepting a request connects both users', async () => {
    const res = await request(app).put(`/api/connections/${requestId}/accept`).set(auth(brian));
    expect(res.status).toBe(200);

    const sender = await request(app).get('/api/connections').set(auth(alice));
    expect(sender.body.connected).toHaveLength(1);
    expect(sender.body.outgoing).toHaveLength(0);

    const receiver = await request(app).get('/api/connections').set(auth(brian));
    expect(receiver.body.connected).toHaveLength(1);
    expect(receiver.body.incoming).toHaveLength(0);
  });

  test('a declined request is removed and can be sent again', async () => {
    const sent = await request(app).post('/api/connections').set(auth(carol)).send({ userId: alice.id });
    const declined = await request(app)
      .put(`/api/connections/${sent.body.connection.id}/decline`)
      .set(auth(alice));
    expect(declined.status).toBe(200);

    const list = await request(app).get('/api/connections').set(auth(carol));
    expect(list.body.outgoing).toHaveLength(0);

    const again = await request(app).post('/api/connections').set(auth(carol)).send({ userId: alice.id });
    expect(again.status).toBe(201);
  });
});
