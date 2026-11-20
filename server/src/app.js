const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const config = require('./config');

const app = express();

if (config.isProduction) {
  // The hosting service sits in front of the app, so trust it to tell us
  // the real address of the user (needed for the login limit) and the protocol
  app.set('trust proxy', 1);

  // Send anyone who opens the site over plain HTTP to HTTPS
  app.use((req, res, next) => {
    if (req.secure) return next();
    res.redirect(301, `https://${req.headers.host}${req.originalUrl}`);
  });
}

// Security headers, for example stopping other sites from showing YouthLink in a frame
app.use(helmet());
app.use(cors());
// Requests bigger than 100kb are refused, nobody needs to send that much text
app.use(express.json({ limit: '100kb' }));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/profile', require('./routes/profile'));
app.use('/api/matches', require('./routes/matches'));
app.use('/api/connections', require('./routes/connections'));
app.use('/api/teams', require('./routes/teams'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/mentorship', require('./routes/mentorship'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/admin', require('./routes/admin'));

// Any other route
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Unexpected errors
app.use((err, req, res, next) => {
  // Errors caused by the request itself, such as broken JSON or a body that is too large
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'The request could not be read' });
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'The request is too large' });
  }

  console.error(err);
  res.status(500).json({ error: 'Something went wrong, please try again' });
});

module.exports = app;
