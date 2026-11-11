const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/profile', require('./routes/profile'));

// Any other route
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Unexpected errors
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Something went wrong, please try again' });
});

module.exports = app;
