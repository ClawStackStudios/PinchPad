# ShellPlate Backend Skeleton Manifest

Complete backend infrastructure for ShellPlate, built from ClawStack Studios core systems.

## Directory Structure

```
.crustagent/skeleton/
├── server.js                    # Express server entry point (modified with CUSTOMIZE slots)
├── .env.example                 # Environment configuration template
│
└── server/
    ├── database.js              # SQLite initialization with migration logic (modified)
    │
    ├── lib/
    │   └── crypto.js            # Token generation and hashing utilities
    │
    ├── middleware/
    │   └── auth.js              # Bearer token authentication middleware
    │
    ├── routes/
    │   ├── auth.js              # User registration, token, verification (with ClawKeys header)
    │   ├── agents.js            # Lobster Keys management endpoints
    │   └── settings.js          # User profile and appearance settings
    │
    └── services/
        ├── agentService.js      # Agent Key lifecycle (create, revoke, delete)
        └── settingsService.js   # Profile and appearance data operations
```

## Core Tables (Preserved Verbatim)

### users
- User identities with ClawStack-compatible structure
- Stores username, display_name, avatar, theme, notifications_enabled
- key_hash field for authentication

### api_tokens
- Session tokens (Bearer tokens with `api-` prefix)
- 24-hour expiration
- Automatically purged on startup and hourly

### lobster_keys
- Agent keys with `lb-` prefix for cross-app recognition
- Supports expiration types: days or 'never'
- Permissions stored as JSON
- Active/revoked tracking

## Customization Points

### 1. **server/database.js** - Custom Tables (Lines 47-65)
Add app-specific tables in the marked CUSTOMIZE block:
```sql
CREATE TABLE IF NOT EXISTS your_table (
  id TEXT PRIMARY KEY,
  -- your columns
);
```

### 2. **server.js** - CORS Origin (Lines 37-48)
Update domain for production:
```javascript
origin: IS_PROD
  ? ['https://yourdomain.com', 'https://www.yourdomain.com']
  : 'http://localhost:6565',
```

### 3. **server.js** - Custom Routes (Lines 71-81)
Register additional route handlers:
```javascript
import customRoutes from './server/routes/custom.js'
app.use('/api/custom', customRoutes)
```

## Security Features

- Helmet.js for HTTP header protection
- CORS with origin whitelist
- Bearer token validation on protected routes
- Timing-safe hash comparison for key verification
- Foreign key constraints enabled in SQLite

## API Endpoints

### Authentication
- `POST /api/auth/register` — Create new user
- `POST /api/auth/token` — Issue session token
- `GET /api/auth/verify` — Verify current session
- `POST /api/auth/logout` — Invalidate token
- `POST /api/auth/lookup` — Find user by key hash

### Agent Keys
- `GET /api/agents/keys` — List user's keys
- `POST /api/agents/keys` — Create new key
- `POST /api/agents/keys/:id/revoke` — Deactivate key
- `DELETE /api/agents/keys/:id` — Remove key

### Settings
- `GET /api/settings/profile` — Fetch user profile
- `POST /api/settings/profile` — Update profile
- `GET /api/settings/appearance` — Fetch theme/notification settings
- `POST /api/settings/appearance` — Update appearance
- `GET /api/settings/export` — Export all user data

### Health
- `GET /health` — Server health check

## Token Cleanup

- Expired tokens purged on server startup
- Hourly purge job runs automatically via `setInterval`

## Environment Variables

```
NODE_ENV=development|production
PORT=6262
DATA_DIR=./data
```

## Implementation Checklist

- [x] Core auth system (users, api_tokens, lobster_keys)
- [x] Bearer token middleware with 24h expiration
- [x] Agent key (Lobster Key) service
- [x] User profile and settings management
- [x] CORS configured with customization slot
- [x] Helmet security headers
- [x] Database migration logic
- [x] Token expiration cleanup
- [x] Cross-app key recognition (ClawStack integration ready)

## Next Steps

1. **Copy to project**: Clone entire `.crustagent/skeleton` directory to your ShellPlate project
2. **Customize database**: Add custom tables to `server/database.js`
3. **Configure CORS**: Update domain in `server.js`
4. **Add custom routes**: Create route handlers and register in `server.js`
5. **Set environment**: Copy `.env.example` to `.env` and configure
6. **Install dependencies**: Ensure `better-sqlite3`, `express`, `cors`, `helmet` installed
7. **Start server**: `node server.js` (or via npm scripts)

## Notes

- All three core tables (users, api_tokens, lobster_keys) are **verbatim** from ClawStack Studios
- Auth logic preserved exactly — no modifications to core security
- Lobster Keys maintain `lb-` prefix for cross-app recognition
- All routes are authentication-protected except `/health` and auth endpoints
- Database uses SQLite with foreign key constraints enabled
