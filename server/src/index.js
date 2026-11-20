const http = require('http');
const app = require('./app');
const config = require('./config');
const { startRealtime } = require('./realtime');
const { startDailyBackups } = require('./backup');
const db = require('./db');
const { seedDemoData } = require('./seed');

// On free hosting the database is wiped every time the server restarts.
// With SEED_IF_EMPTY=true the demo data is added again, so there is always something to try.
if (process.env.SEED_IF_EMPTY === 'true') {
  const { count } = db.prepare('SELECT COUNT(*) AS count FROM users').get();
  if (count === 0) {
    const total = seedDemoData();
    console.log(`The database was empty, so ${total} demo users were added`);
  }
}

// Socket.IO shares the same server and port as the API
const server = http.createServer(app);
startRealtime(server);

server.listen(config.port, () => {
  console.log(`YouthLink API running on http://localhost:${config.port}`);
  startDailyBackups();
});
