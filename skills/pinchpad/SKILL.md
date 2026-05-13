---
name: pinchpad-agent-api©™
description: The canonical PinchPad©™ agent integration skill. Full API reference for autonomous agents (Lobsters©™) to authenticate, manage pearls, pots, and integrate with the PinchPad note-taking system.
---

# PinchPad©™ Agent API Skill

## Overview

PinchPad©™ is a **local-first sovereign note-taking system** that agents can integrate with via HTTP API. This skill document defines every action an agent can take — from authentication to CRUD operations on pearls and pots.

**Key Principles:**
- **Human-First Permissions:** All agents must be explicitly authorized by a human via the Settings panel before accessing resources
- **Granular Access Control:** Each agent key has independent permission grants (`canRead`, `canWrite`, `canEdit`, `canDelete`)
- **Cryptographic Identity:** Agents prove identity via a `lb-` (Lobster) key, issued tokens are `api-` prefixed
- **No Passwords:** Authentication is stateless and cryptographic — no session state, no passwords, no recovery email

---

## Table of Contents

1. [Authentication](#authentication)
2. [Permissions Model](#permissions-model)
3. [Pearls API](#pearls-api)
4. [Pots API](#pots-api)
5. [Photos API](#photos-api)
6. [Agent Keys API](#agent-keys-api)
7. [Error Codes](#error-codes)
8. [Rate Limiting](#rate-limiting)

---

## Authentication

### Key Types

| Prefix | Type | Usage | Context |
|--------|------|-------|---------|
| `hu-` | Human Identity | Secret stored in offline identity file | Login; never sent to server |
| `lb-` | Lobster (Agent) Key | Secret used to request API tokens | Agent setup; never sent to server |
| `api-` | API Token | Bearer token for API calls | All authenticated requests |

### Step 1: Generate Agent Key

A **human** creates an agent key in **Settings → Lobster Keys**.

```
UI: Settings panel → "+ New Agent Key" button
    └─ Human provides a name (e.g., "My Note Crawler")
    └─ System generates a 64-character `lb-` key
    └─ Human copies the key and gives it to the agent
```

### Step 2: Exchange Key for API Token

The **agent** sends its `lb-` key directly to the token endpoint.

```http
POST /api/auth/token
Content-Type: application/json

{
  "type": "agent",
  "ownerKey": "lb-<your-lobster-key>"
}
```

**Response — 201 Created:**
```json
{
  "success": true,
  "data": {
    "token": "api-aBcDeFgHiJkLmNoPqRsTuVwXyZ123456",
    "type": "agent",
    "createdAt": "2026-05-12T10:00:00.000Z",
    "expiresAt": "2026-05-13T10:00:00.000Z"
  }
}
```

**Error Responses:**
- `401 Unauthorized` — key is invalid, revoked, or expired
- `400 Bad Request` — missing or malformed fields
- `429 Too Many Requests` — rate limit exceeded

### Step 3: Use the API Token

For all subsequent requests, include the token in the `Authorization` header:

```http
Authorization: Bearer api-aBcDeFgHiJkLmNoPqRsTuVwXyZ123456
```

### Validate Token

```http
GET /api/auth/validate
Authorization: Bearer api-...
```

**Response — 200 OK:**
```json
{
  "success": true,
  "data": {
    "valid": true,
    "keyType": "agent",
    "userUuid": "uuid-of-the-human-owner"
  }
}
```

---

## Permissions Model

### How Permissions Work

1. **Human creates an agent key** in Settings → Lobster Keys
2. **Human grants permissions** to that key: `canRead`, `canWrite`, `canEdit`, `canDelete`
3. **Agent obtains an `api-` token** by exchanging its `lb-` key
4. **Server checks permissions** on every request using the token's associated key

### Permission Bits

| Permission | Allows |
|-----------|--------|
| `canRead` | `GET /api/notes`, `GET /api/notes/export`, `GET /api/pots`, `GET /api/photos/:id` |
| `canWrite` | `POST /api/notes`, `POST /api/notes/bulk`, `POST /api/pots`, `POST /api/photos/upload` |
| `canEdit` | `PUT /api/notes/:id`, `PATCH /api/notes/:id/starred`, `PATCH /api/notes/:id/pinned`, `PATCH /api/pots/:id` |
| `canDelete` | `DELETE /api/notes/:id`, `DELETE /api/pots/:id`, `DELETE /api/photos/:id` |

### Failure Mode: Missing Permission

```http
403 Forbidden
Content-Type: application/json

{
  "error": "Forbidden",
  "message": "This agent key does not have permission to write"
}
```

---

## Pearls API

Pearls are encrypted notes. All endpoints require `Authorization: Bearer api-...`.

### GET /api/notes — List All Pearls

```http
GET /api/notes
Authorization: Bearer api-...
```

**Response — 200 OK:**
```json
{
  "data": [
    {
      "id": "uuid-1",
      "title": "My Note",
      "content": "Note body text",
      "starred": 0,
      "pinned": 0,
      "pot_id": null,
      "created_at": "2026-05-12T10:00:00.000Z",
      "updated_at": "2026-05-12T10:00:00.000Z",
      "photos": []
    }
  ]
}
```

**Permissions Required:** `canRead`

### POST /api/notes — Create Pearl

```http
POST /api/notes
Authorization: Bearer api-...
Content-Type: application/json

{
  "title": "New Pearl",
  "content": "Pearl body text",
  "starred": false,
  "pinned": false,
  "pot_id": null
}
```

**Response — 201 Created:**
```json
{
  "data": {
    "id": "auto-generated-uuid",
    "title": "New Pearl",
    "content": "Pearl body text",
    "starred": 0,
    "pinned": 0,
    "pot_id": null,
    "created_at": "2026-05-12T10:00:00.000Z",
    "updated_at": "2026-05-12T10:00:00.000Z"
  }
}
```

**Permissions Required:** `canWrite`

### PUT /api/notes/:id — Update Pearl

```http
PUT /api/notes/uuid-1
Authorization: Bearer api-...
Content-Type: application/json

{
  "title": "Updated Title",
  "content": "Updated content",
  "starred": true,
  "pinned": false
}
```

Uses `coalesce` — only include fields you want to change. Omitted fields stay unchanged.

**Response — 200 OK:** Returns updated pearl object.

**Permissions Required:** `canEdit`

### PATCH /api/notes/:id/starred — Toggle Star

```http
PATCH /api/notes/uuid-1/starred
Authorization: Bearer api-...
Content-Type: application/json

{ "value": true }
```

**Response — 200 OK:** Returns updated pearl object.

**Permissions Required:** `canEdit`

### PATCH /api/notes/:id/pinned — Toggle Pin

```http
PATCH /api/notes/uuid-1/pinned
Authorization: Bearer api-...
Content-Type: application/json

{ "value": true }
```

**Response — 200 OK:** Returns updated pearl object.

**Permissions Required:** `canEdit`

### DELETE /api/notes/:id — Delete Pearl

```http
DELETE /api/notes/uuid-1
Authorization: Bearer api-...
```

**Response — 200 OK:**
```json
{ "data": { "success": true } }
```

**Permissions Required:** `canDelete`

### POST /api/notes/bulk — Bulk Create Pearls

```http
POST /api/notes/bulk
Authorization: Bearer api-...
Content-Type: application/json

{
  "notes": [
    { "title": "Pearl 1", "content": "Body 1" },
    { "title": "Pearl 2", "content": "Body 2" }
  ]
}
```

**Response — 201 Created** (or 207 if partial failures):
```json
{
  "success": true,
  "data": {
    "imported": 2,
    "failed": 0,
    "errors": []
  }
}
```

**Permissions Required:** `canWrite`

### GET /api/notes/export — Export Pearls

```http
GET /api/notes/export?format=json
GET /api/notes/export?format=md&ids=uuid1,uuid2
Authorization: Bearer api-...
```

**Formats:** `json`, `md`, `html`, `pdf`

**Response:** ZIP file download.

**Permissions Required:** `canRead`

---

## Pots API

Pots are collection folders for pearls. A pearl can belong to one pot (or none).

### GET /api/pots — List Pots

```http
GET /api/pots
Authorization: Bearer api-...
```

**Response — 200 OK:**
```json
{
  "data": [
    {
      "id": "pot-uuid-1",
      "name": "Research",
      "color": "#f59e0b",
      "created_at": "2026-05-12T10:00:00.000Z",
      "pearl_count": 5
    }
  ]
}
```

**Permissions Required:** `canRead`

### POST /api/pots — Create Pot

```http
POST /api/pots
Authorization: Bearer api-...
Content-Type: application/json

{ "name": "Ideas", "color": "#8b5cf6" }
```

**Response — 201 Created:** Returns new pot object.

**Permissions Required:** `canWrite`

### PATCH /api/pots/:id — Update Pot

```http
PATCH /api/pots/pot-uuid-1
Authorization: Bearer api-...
Content-Type: application/json

{ "name": "New Name", "color": "#10b981" }
```

**Response — 200 OK:** Returns updated pot object.

**Permissions Required:** `canEdit`

### DELETE /api/pots/:id — Delete Pot

```http
DELETE /api/pots/pot-uuid-1
Authorization: Bearer api-...
```

Deleting a pot **un-pots** all pearls inside it (sets `pot_id = NULL`). Pearls are NOT deleted.

**Response — 200 OK:**
```json
{ "data": { "success": true, "unpotted": 5 } }
```

**Permissions Required:** `canDelete`

---

## Photos API

Photos (Jewels) can be attached to pearls.

### POST /api/photos/upload — Upload Photo

```http
POST /api/photos/upload?pearlId=note-uuid-1
Authorization: Bearer api-...
Content-Type: multipart/form-data

Form field: photo (max 10MB)
```

**Response — 201 Created:**
```json
{
  "success": true,
  "data": {
    "id": "photo-uuid",
    "filename": "image.png",
    "mimeType": "image/png",
    "url": "/api/photos/photo-uuid"
  }
}
```

**Permissions Required:** `canWrite`

### GET /api/photos/:id — Get Photo

```http
GET /api/photos/photo-uuid
Authorization: Bearer api-...
```

Or via query token for browser `<img>` tags:
```
GET /api/photos/photo-uuid?token=api-...
```

**Response:** Binary image file with proper Content-Type.

**Permissions Required:** `canRead`

### DELETE /api/photos/:id — Delete Photo

```http
DELETE /api/photos/photo-uuid
Authorization: Bearer api-...
```

**Response — 200 OK:**
```json
{ "success": true }
```

**Permissions Required:** `canDelete`

---

## Agent Keys API

Agent key management is restricted to **human users only** (`requireHuman` middleware). Agents cannot manage their own or other agent keys.

### GET /api/agents — List Agent Keys

```http
GET /api/agents
Authorization: Bearer api-...  (must be human token)
```

### POST /api/agents — Create Agent Key

```http
POST /api/agents
Authorization: Bearer api-...  (must be human token)
Content-Type: application/json

{
  "name": "My Crawler",
  "description": "Crawls and imports notes",
  "permissions": { "canRead": true, "canWrite": true, "canEdit": false, "canDelete": false },
  "expiration_type": "never",
  "rate_limit": 100,
  "api_key": "lb-..."
}
```

### PUT /api/agents/:id/revoke — Revoke Agent Key

```http
PUT /api/agents/agent-uuid/revoke
Authorization: Bearer api-...  (must be human token)
```

### DELETE /api/agents/:id — Delete Agent Key

```http
DELETE /api/agents/agent-uuid
Authorization: Bearer api-...  (must be human token)
```

---

## Error Codes

| Code | Meaning |
|------|---------|
| `400` | Bad Request — missing or malformed fields |
| `401` | Unauthorized — missing, invalid, or expired token |
| `403` | Forbidden — token lacks required permission |
| `404` | Not Found — resource doesn't exist |
| `409` | Conflict — duplicate resource (e.g., username taken) |
| `429` | Too Many Requests — rate limit exceeded |
| `500` | Internal Server Error |

All errors follow this format:
```json
{
  "success": false,
  "error": "Human-readable error message"
}
```

---

## Rate Limiting

- **Auth endpoints** (`/api/auth/*`): 10 requests per minute per IP
- **API endpoints** (`/api/*`): Global rate limiter applied
- **Agent keys** can have custom `rate_limit` (1-10000 requests/minute) set by the human owner

---

*Generated by PinchPad©™ — ClawStack Studios©™*
