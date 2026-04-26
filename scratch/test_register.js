import db from '../src/server/database/index.js';
import crypto from 'crypto';

const uuid = crypto.randomUUID();
const username = 'testuser_' + Date.now();
const keyHash = crypto.createHash('sha256').update('password').digest('hex');

try {
  const result = db.prepare('INSERT INTO users (uuid, username, display_name, key_hash, created_at) VALUES (?, ?, ?, ?, ?)').run(
    uuid,
    username,
    null,
    keyHash,
    new Date().toISOString()
  );
  console.log('Registration success:', result);
} catch (err) {
  console.error('Registration failed:', err);
}
