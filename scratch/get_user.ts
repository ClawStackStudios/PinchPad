import db from '../src/server/database/index';

try {
  const user = db.prepare('SELECT * FROM users LIMIT 1').get();
  console.log('User found:', user ? { uuid: user.uuid, username: user.username } : 'None');
  if (user) {
    console.log('Key Hash:', user.key_hash);
  }
} catch (err) {
  console.error('Error:', err);
}
