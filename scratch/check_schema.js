import db from '../src/server/database/index.js';

console.log("USERS SCHEMA:");
const userCols = db.prepare("PRAGMA table_info('users')").all();
console.log(userCols);

console.log("AUDIT LOGS SCHEMA:");
const auditCols = db.prepare("PRAGMA table_info('audit_logs')").all();
console.log(auditCols);

