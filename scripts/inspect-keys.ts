import Database from 'better-sqlite3-multiple-ciphers';
import dotenv from 'dotenv';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const dbPath = path.join(__dirname, '..', 'data', 'db.sqlite');
const key = process.env.DB_ENCRYPTION_KEY;

console.log('🦞 PinchPad DB Sentinel — Agent Keys Inspector');
console.log('------------------------------------------------');

try {
  const db = new Database(dbPath);
  if (key) {
    db.pragma(`key = '${key}'`);
  }
  
  const keys = db.prepare("SELECT * FROM agent_keys").all() as any[];
  console.log(`Total agent keys found: ${keys.length}\n`);

  const searchArg = process.argv[2];
  if (searchArg) {
    console.log(`Searching for keys matching or hashing to: "${searchArg}"...\n`);
    let found = false;
    keys.forEach(k => {
      const hash = crypto.createHash('sha256').update(k.api_key).digest('hex');
      const isHashMatch = hash.startsWith(searchArg.toLowerCase()) || hash === searchArg.toLowerCase();
      const isNameMatch = k.name?.toLowerCase().includes(searchArg.toLowerCase());
      const isKeyMatch = k.api_key === searchArg;

      if (isHashMatch || isNameMatch || isKeyMatch) {
        console.log(`🎉 MATCH FOUND [ID: ${k.id}]:`);
        console.log(`   Name:        ${k.name}`);
        console.log(`   Active:      ${k.is_active ? '✅ Yes' : '❌ No'}`);
        console.log(`   Permissions: ${k.permissions}`);
        console.log(`   Plaintext:   ${k.api_key}`);
        console.log(`   SHA-256:     ${hash}`);
        console.log('------------------------------------------------');
        found = true;
      }
    });
    if (!found) {
      console.log('❌ No keys matching search criteria found.');
    }
  } else {
    console.log('Summary of Active Agent Keys:');
    let activeCount = 0;
    keys.forEach(k => {
      if (k.is_active) {
        const hash = crypto.createHash('sha256').update(k.api_key).digest('hex');
        console.log(`- Name:        ${k.name}`);
        console.log(`  Permissions: ${k.permissions}`);
        console.log(`  Plaintext:   ${k.api_key}`);
        console.log(`  SHA-256:     ${hash}`);
        console.log('');
        activeCount++;
      }
    });
    console.log(`Active keys listed: ${activeCount}`);
    console.log('\n💡 Tip: Run "npx tsx scripts/inspect-keys.ts <hash-or-name>" to search for a specific key.');
  }

  db.close();
} catch (err) {
  console.error('Error inspecting database:', err);
}
