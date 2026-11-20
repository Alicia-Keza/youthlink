const fs = require('fs');
const os = require('os');
const path = require('path');
const Database = require('better-sqlite3');
const { createUser } = require('./helpers');
const { backupDatabase, KEEP_DAYS } = require('../src/backup');

describe('Daily database backup (NFR8)', () => {
  let folder;

  beforeAll(async () => {
    folder = fs.mkdtempSync(path.join(os.tmpdir(), 'youthlink-backup-'));
    await createUser('Alice');
  });

  afterAll(() => {
    fs.rmSync(folder, { recursive: true, force: true });
  });

  test('saves a copy of the database with the data in it', async () => {
    const file = await backupDatabase(folder);

    expect(path.basename(file)).toMatch(/^youthlink-\d{4}-\d{2}-\d{2}\.db$/);

    const copy = new Database(file, { readonly: true });
    const user = copy.prepare('SELECT name FROM users WHERE email = ?').get('alice@example.com');
    copy.close();
    expect(user.name).toBe('Alice');
  });

  test('only keeps the backups of the last 7 days', async () => {
    // Pretend backups were made on ten earlier days
    for (let day = 1; day <= 10; day++) {
      fs.writeFileSync(path.join(folder, `youthlink-2026-10-${String(day).padStart(2, '0')}.db`), '');
    }

    await backupDatabase(folder);

    const backups = fs.readdirSync(folder).sort();
    expect(backups).toHaveLength(KEEP_DAYS);
    // The oldest ones are deleted and today's backup is kept
    expect(backups).not.toContain('youthlink-2026-10-01.db');
    expect(backups[backups.length - 1]).toBe(`youthlink-${new Date().toISOString().slice(0, 10)}.db`);
  });
});
