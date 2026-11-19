const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
const config = require('./config');

const db = new Database(config.dbFile);
db.pragma('foreign_keys = ON');

// Create the tables the first time the server starts
const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
db.exec(schema);

// Columns added after the first version. CREATE TABLE IF NOT EXISTS does not
// change a table that already exists, so add them to older databases here.
const userColumns = db.prepare('PRAGMA table_info(users)').all().map((column) => column.name);
if (!userColumns.includes('suspended_at')) {
  db.exec('ALTER TABLE users ADD COLUMN suspended_at TEXT');
}

module.exports = db;
