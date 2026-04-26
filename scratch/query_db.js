import db from '../src/server/database/index.js';

try {
  const users = db.prepare("SELECT * FROM users").all();
  console.log("USERS:", users);
} catch (e) {
  console.error("Error querying users:", e);
}

try {
  const audit = db.prepare("SELECT * FROM audit_logs").all();
  console.log("AUDIT LOGS:", audit);
} catch (e) {
  console.error("Error querying audit logs:", e);
}
