# ⚡ PinchPad©™ — Premium Quickstart Guide

**Maintained by CrustAgent©™**

Welcome to **PinchPad©™** — a privacy-first, self-hostable, zero-knowledge pearl (note) notebook designed for the Human-Agent ecosystem. This guide provides paste-and-run setups for both developers and self-hosters to hatch their own Burrows in minutes.

---

## 🚀 The Quick Hatch (Dev Flow)

To set up PinchPad locally for development, run the following commands:

```bash
# 1. Clone the repository
git clone https://github.com/ClawStackStudios/PinchPad.git
cd PinchPad

# 2. Install dependencies
npm install

# 3. Hatch the environment variables configuration
cp .env.example .env.local

# 4. Start frontend (Vite) and backend (Express) concurrently
npm run scuttle:dev-start
# → Frontend: http://localhost:8282
# → Backend: http://localhost:8383/api/health
```

---

## 🐳 The Sovereign Dock (Docker Setup)

For production deployments, PinchPad runs as a lightweight Node-backed container.

### 1. Create a `docker-compose.yml`
Save the following configuration inside your hosting directory:

```yaml
services:
  pinchpad:
    image: ghcr.io/clawstackstudios/pinchpad:latest
    container_name: pinchpad-burrow
    ports:
      - "8282:8282"
    environment:
      - NODE_ENV=production
      - PORT=8282
      - DATA_DIR=/app/data
      - DB_ENCRYPTION_KEY=your-openssl-base64-key-here
      - ADMIN_TOKEN=your-super-admin-token-here
      - ENFORCE_HTTPS=true
    volumes:
      - ./data:/app/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8282/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

### 2. Launch the Stack
```bash
# Generate a secure 32-byte base64 database encryption key
openssl rand -base64 32

# Spawn the container
docker compose up -d
```

---

## 🥚 The Identity Hatch (Logging In)

PinchPad does not use traditional accounts, emails, or password textboxes. Access is completely anchored to your **ClawKey©™** (`hu-`):

1. **The Setup Wizard**: On your first visit, you will be prompted to choose a username.
2. **Key Generation**: The client-side wizard generates a cryptographically random **ClawKey©™** (`hu-` prefix) in your browser.
3. **The Key File**: The browser downloads `pinchpad_identity_key.json`.
4. **Authenticating**: To log in from any device, simply drag-and-drop or select your `pinchpad_identity_key.json` file.
5. **Security Invariant**: ⚠️ **Loss of this file means absolute lockout.** There are no recovery forms or password resets. Keep your key file backed up in a secure, offline location.

---

## 🤖 The Agent Handshake

PinchPad allows external autonomous agents to scuttle notes inside your Pots using **LobsterKeys©™** (`lb-`). 

### 1. Plaintext Key Handshake
To exchange an `lb-` key for a short-lived `api-` token via curl:

```bash
curl -X POST http://localhost:8282/api/auth/token \
  -H "Content-Type: application/json" \
  -d '{
    "type": "agent",
    "key": "lb-your-agent-key-string"
  }'
```

### 2. Secure Pre-Hashed Handshake (Timing-Safe)
To authenticatively exchange a key without exposing the plaintext token over public networks, agents can leverage the pre-hashed timing-safe handshake:

```bash
# Calculate SHA-256 hash of your agent key
echo -n "lb-your-agent-key-string" | shasum -a 256

# Request session token using the hash (server performs timing-safe lookup)
curl -X POST http://localhost:8282/api/auth/token \
  -H "Content-Type: application/json" \
  -d '{
    "type": "agent",
    "keyHash": "hash-calculated-above"
  }'
```

The server returns:
```json
{
  "token": "api-session-token",
  "expiresAt": "2026-05-19T10:00:00Z"
}
```

Use this token inside the `Authorization: Bearer <api-token>` header for subsequent REST requests.

---

**Stay Clawed. Stay Sovereign.** 🦞⚓🌊
