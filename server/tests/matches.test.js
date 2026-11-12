const { request, app, createUser, auth } = require('./helpers');
const { scoreMatch, findMatches } = require('../src/matching');

function profile(skillAreas, lookingFor, interests = []) {
  return {
    skills: skillAreas.map((category) => ({ name: `${category} skill`, category })),
    lookingFor,
    interests,
  };
}

describe('Matching algorithm (FR3)', () => {
  test('scores users with complementary skills', () => {
    const developer = profile(['Technology'], ['Marketing'], ['Education']);
    const marketer = profile(['Marketing'], ['Technology'], ['education']);

    const result = scoreMatch(developer, marketer);

    expect(result.theyOffer).toEqual(['Marketing']);
    expect(result.iOffer).toEqual(['Technology']);
    expect(result.sharedInterests).toEqual(['Education']);
    expect(result.score).toBe(6);
  });

  test('leaves out users with no complementary skills', () => {
    const developer = profile(['Technology'], ['Marketing']);
    const otherDeveloper = profile(['Technology'], ['Design']);

    expect(findMatches(developer, [otherDeveloper])).toEqual([]);
  });

  test('puts the best match first', () => {
    const developer = profile(['Technology'], ['Marketing', 'Business']);
    const oneWay = { id: 1, ...profile(['Marketing'], ['Design']) };
    const twoWay = { id: 2, ...profile(['Business'], ['Technology']) };

    const matches = findMatches(developer, [oneWay, twoWay]);

    expect(matches.map((match) => match.user.id)).toEqual([2, 1]);
  });
});

describe('Matches API (FR3)', () => {
  let developer;
  let marketer;
  let accountant;

  async function setUp(user, lookingFor, skillName, category) {
    await request(app).put('/api/profile/me').set(auth(user)).send({ lookingFor });
    await request(app).post('/api/profile/me/skills').set(auth(user)).send({ name: skillName, category });
  }

  beforeAll(async () => {
    developer = await createUser('Developer');
    marketer = await createUser('Marketer');
    accountant = await createUser('Accountant');

    await setUp(developer, ['Marketing'], 'JavaScript', 'Technology');
    await setUp(marketer, ['Technology'], 'Social media', 'Marketing');
    await setUp(accountant, ['Design'], 'Bookkeeping', 'Finance');
  });

  test('returns users with complementary skills', async () => {
    const res = await request(app).get('/api/matches').set(auth(developer));

    expect(res.status).toBe(200);
    expect(res.body.matches).toHaveLength(1);
    expect(res.body.matches[0].user.name).toBe('Marketer');
    expect(res.body.matches[0].theyOffer).toEqual(['Marketing']);
  });

  test('search looks at names and skills', async () => {
    const found = await request(app).get('/api/matches?search=social').set(auth(developer));
    expect(found.body.matches).toHaveLength(1);

    const notFound = await request(app).get('/api/matches?search=cooking').set(auth(developer));
    expect(notFound.body.matches).toHaveLength(0);
  });

  test('filters by skill category', async () => {
    const marketing = await request(app).get('/api/matches?category=Marketing').set(auth(developer));
    expect(marketing.body.matches).toHaveLength(1);

    const finance = await request(app).get('/api/matches?category=Finance').set(auth(developer));
    expect(finance.body.matches).toHaveLength(0);
  });

  test('shows the connection status of each match', async () => {
    const before = await request(app).get('/api/matches').set(auth(developer));
    expect(before.body.matches[0].connectionStatus).toBe('none');

    await request(app).post('/api/connections').set(auth(developer)).send({ userId: marketer.id });

    const sent = await request(app).get('/api/matches').set(auth(developer));
    expect(sent.body.matches[0].connectionStatus).toBe('request_sent');

    const received = await request(app).get('/api/matches').set(auth(marketer));
    expect(received.body.matches[0].connectionStatus).toBe('request_received');
  });

  test('needs a login', async () => {
    const res = await request(app).get('/api/matches');
    expect(res.status).toBe(401);
  });
});
