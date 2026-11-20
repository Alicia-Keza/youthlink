const fs = require('fs');
const path = require('path');
const db = require('./db');
const config = require('./config');

// How many daily backups to keep. Older ones are deleted.
const KEEP_DAYS = 7;
const BACKUP_PATTERN = /^youthlink-\d{4}-\d{2}-\d{2}\.db$/;

// Copies the whole database into the backup folder, one file per day,
// for example backups/youthlink-2026-11-20.db. Running it again on the same
// day replaces that day's file.
async function backupDatabase(folder = config.backupDir) {
  fs.mkdirSync(folder, { recursive: true });

  const today = new Date().toISOString().slice(0, 10);
  const file = path.join(folder, `youthlink-${today}.db`);
  await db.backup(file);

  // File names start with the date, so sorting them puts the oldest first
  const backups = fs.readdirSync(folder).filter((name) => BACKUP_PATTERN.test(name)).sort();
  backups.slice(0, -KEEP_DAYS).forEach((name) => fs.unlinkSync(path.join(folder, name)));

  return file;
}

// Makes a backup when the server starts and then once every 24 hours
function startDailyBackups() {
  const runBackup = () => {
    backupDatabase()
      .then((file) => console.log(`Database backup saved to ${file}`))
      .catch((err) => console.error('Database backup failed:', err.message));
  };

  runBackup();
  setInterval(runBackup, 24 * 60 * 60 * 1000);
}

// Run a backup by hand with: npm run backup
if (require.main === module) {
  backupDatabase().then((file) => console.log(`Database backup saved to ${file}`));
}

module.exports = { backupDatabase, startDailyBackups, KEEP_DAYS };
