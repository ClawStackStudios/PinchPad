import db from '../src/server/database/index';

try {
  const logs = db.prepare('SELECT * FROM audit_logs ORDER BY id DESC LIMIT 5').all();
  console.log(JSON.stringify(logs, null, 2));
} catch (err) {
  console.error('Error reading logs:', err);
}
