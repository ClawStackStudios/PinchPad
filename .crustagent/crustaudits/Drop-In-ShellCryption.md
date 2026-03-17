# 🦞 Drop-In ShellCryption™ — Database Encryption at Rest

**ClawChives SQLCipher Database Encryption Configuration**

---

## Overview

ClawChives uses **SQLCipher** (via `better-sqlite3-multiple-ciphers`) to provide **AES-256 encryption at rest** for the SQLite database. The encryption key is managed via environment variables and validated on startup.

---

## Environment Variable: `DB_ENCRYPTION_KEY`

### Format
```
DB_ENCRYPTION_KEY=<base64-encoded-32-byte-key>
```

**Requirements:**
- **Base64-encoded** (alphanumeric, `+`, `/`, `=` only)
- **32 bytes** (decoded) = **44 characters** (base64-encoded with padding)
- **Must be valid base64** or startup will fail with:
  ```
  Error: [DB] DB_ENCRYPTION_KEY must be base64-encoded (alphanumeric, +, /, = only).
  ```

### Example Keys
```bash
# Valid (44 chars, base64)
DB_ENCRYPTION_KEY=aBc1+2D3e4F5g6H7i8J9k0L1m2N3o4P5q==

# Valid (generates 32 random bytes, base64-encoded)
DB_ENCRYPTION_KEY=MNHDu5SZLuN10YB1/BFuz5tupvH5m8POaUEmlfWMajY=

# INVALID (not base64)
DB_ENCRYPTION_KEY=MyP@ssw0rd!  ❌

# INVALID (wrong length)
DB_ENCRYPTION_KEY=abcd1234==  ❌
```

### Generating a Key

**Node.js:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**OpenSSL:**
```bash
openssl rand -base64 32
```

**Output Example:**
```
aBc1+2D3e4F5g6H7i8J9k0L1m2N3o4P5q==
```

---

## Docker Deployment

### Development (docker-compose.dev.yml)

```yaml
services:
  claw-chives:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: clawchives
    ports:
      - "4545:4545"
    volumes:
      - ./data:/app/data
    environment:
      - NODE_ENV=production
      - PORT=4545
      - DATA_DIR=/app/data
      - DB_ENCRYPTION_KEY=MNHDu5SZLuN10YB1/BFuz5tupvH5m8POaUEmlfWMajY=  # ← Paste your key here
      - PUID=1000
      - PGID=1000
```

**Start:**
```bash
docker-compose -f docker-compose.dev.yml up --build
```

### Production (docker-compose.yml)

```yaml
services:
  claw-chives:
    image: ghcr.io/acidgreenservers/clawchives:main
    ports:
      - "4545:4545"
    volumes:
      - ./data:/app/data
    environment:
      - NODE_ENV=production
      - PORT=4545
      - DATA_DIR=/app/data
      - DB_ENCRYPTION_KEY=""  # ← Set via env vars or .env file
      - PUID=1000
      - PGID=1000
```

**Start with env var:**
```bash
# Option 1: Command line
export DB_ENCRYPTION_KEY="MNHDu5SZLuN10YB1/BFuz5tupvH5m8POaUEmlfWMajY="
docker-compose -f docker-compose.yml up

# Option 2: .env file
echo "DB_ENCRYPTION_KEY=MNHDu5SZLuN10YB1/BFuz5tupvH5m8POaUEmlfWMajY=" > .env
docker-compose -f docker-compose.yml up
```

---

## Runtime Behavior

### Startup Validation

When the container starts:

```
1. Read DB_ENCRYPTION_KEY from environment
2. Validate format (base64, alphanumeric + +/=)
3. If validation fails:
   → Error: "DB_ENCRYPTION_KEY must be base64-encoded..."
   → Container exits with code 1
4. If validation passes:
   → Proceed to open/encrypt database
```

### Database Migration

**First Run (Plaintext → Encrypted):**
```
1. Open SQLite database at /app/data/db.sqlite
2. Apply SQLCipher key via PRAGMA: key = '{DB_ENCRYPTION_KEY}'
3. Try to read schema (SELECT count(*) FROM sqlite_master)
4. If schema read fails with "not a database":
   → Database was plaintext
   → Trigger migration: ATTACH encrypted.db with key, export tables, swap files
   → Log: "[DB] Detected unencrypted database — migrating to encrypted..."
   → Continue with encrypted database
5. If schema read succeeds:
   → Database already encrypted
   → Proceed normally
```

**Example Startup Log:**
```
🦞 [ClawChives] Initializing Container...
📦 [ClawChives] Fixing permissions for /app/data...
🔒 [ClawChives] Dropping privileges to user 'node' (UID: 1000)...
[DB] SQLite database at /app/data/db.sqlite
[DB] ✅ Database encrypted successfully.
🦞 ClawChives v2 API running on port 4545
```

### Key Mismatch

If you change `DB_ENCRYPTION_KEY` and restart:

```
1. Open encrypted database
2. Apply new key via PRAGMA
3. Try to read schema
4. If key mismatch:
   → SQLite error: "file is not a database"
   → Error thrown: "file is not a database"
   → Container exits
```

**Fix:** Use the correct key that matches the encrypted database.

---

## Data Directory

### Bind Mount
```yaml
volumes:
  - ./data:/app/data
```

### Structure
```
./data/
├── db.sqlite          # Encrypted SQLite database file (AES-256)
├── db.sqlite-shm      # Shared memory file (SQLite WAL mode)
└── db.sqlite-wal      # Write-ahead log file
```

### Ownership
On startup, the entrypoint script fixes permissions:
```bash
chown -R {PUID}:{PGID} /app/data
```

Default: `PUID=1000`, `PGID=1000` (node user)

---

## Security Best Practices

### ✅ DO:
- **Generate unique keys** for each environment (dev, prod, staging)
- **Store keys in secrets management** (Docker Secrets, HashiCorp Vault, 1Password)
- **Rotate keys periodically** (new key → re-encrypt with SQLCipher → backup old)
- **Verify key format** before deployment
- **Back up encrypted databases** alongside key material (separately stored)

### ❌ DON'T:
- **Hardcode keys** in Dockerfiles or git repos
- **Use the same key** across environments
- **Share keys** via unencrypted channels (Slack, email, etc.)
- **Lose the key** (data is permanently inaccessible)
- **Store key in plaintext** in `.env` files committed to git

---

## Troubleshooting

### Error: "DB_ENCRYPTION_KEY must be base64-encoded..."

**Cause:** Key format invalid (contains special chars outside `a-zA-Z0-9+/=`)

**Fix:**
```bash
# Regenerate key
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Update compose file or .env with new key
```

---

### Error: "file is not a database"

**Cause 1:** Key mismatch (database encrypted with different key)
- **Fix:** Use correct `DB_ENCRYPTION_KEY`

**Cause 2:** Database file is plaintext (unencrypted)
- **Fix:** Allow migration by providing a valid key (will auto-encrypt)

---

### Container Exits on Startup

**Check logs:**
```bash
docker-compose -f docker-compose.dev.yml logs clawchives
```

**Look for:**
- `DB_ENCRYPTION_KEY must be base64-encoded`
- `file is not a database`
- Permission errors on `/app/data`

---

## Database Encryption Details

### SQLCipher Configuration

| Setting | Value | Purpose |
|---------|-------|---------|
| Algorithm | AES-256 | Industry-standard encryption |
| Mode | CBC | Cipher Block Chaining |
| Key Derivation | PBKDF2 (4000 iterations) | Derives encryption key from passphrase |
| Page Size | 4096 bytes | SQLite page boundary |

### Encrypted File Format

```
SQLite 3.x 000  [Header]
[Encrypted page 1]
[Encrypted page 2]
[Encrypted page N]
[WAL metadata]
```

All pages are encrypted; plaintext headers reveal nothing about schema or data.

---

## Portability to PinchPad

To port this to **PinchPad**, apply the same pattern:

### 1. Add to `src/server/db.ts` (or equivalent)
```typescript
const encryptionKey = process.env.DB_ENCRYPTION_KEY;

if (encryptionKey) {
  if (!/^[a-zA-Z0-9+/=]+$/.test(encryptionKey)) {
    throw new Error('[DB] DB_ENCRYPTION_KEY must be base64-encoded...');
  }
}

// On database open:
if (encryptionKey) {
  db.pragma(`key = '${encryptionKey}'`);
  // Validate key works by querying schema
}
```

### 2. Add to `docker-compose.yml`
```yaml
environment:
  - DB_ENCRYPTION_KEY=${DB_ENCRYPTION_KEY}
  # or hardcode for dev: DB_ENCRYPTION_KEY=aBc1+2D3e4F5g6H7i8J9k0L1m2N3o4P5q==
```

### 3. Add to Dockerfile entrypoint
```dockerfile
ENV DATA_DIR=/app/data
EXPOSE 3000  # or your port
ENTRYPOINT ["node", "server.js"]  # or equivalent
```

### 4. Generate key on first deployment
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))" > /tmp/key.txt
export DB_ENCRYPTION_KEY=$(cat /tmp/key.txt)
docker-compose up
```

---

**Maintained by CrustAgent©™**
