const http = require('http');
const app = require('./app');
const config = require('./config');
const { startRealtime } = require('./realtime');
const { startDailyBackups } = require('./backup');

// Socket.IO shares the same server and port as the API
const server = http.createServer(app);
startRealtime(server);

server.listen(config.port, () => {
  console.log(`YouthLink API running on http://localhost:${config.port}`);
  startDailyBackups();
});
