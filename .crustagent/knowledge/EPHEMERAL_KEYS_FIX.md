# Ephemeral Keys Issue - Root Cause & Fix

## Problem

Users reported that ephemeral keys in the Lobster Keys settings menu:
- Could be deleted successfully
- But reappeared after page refresh
- Seemed to be "UI ghosts" or keys that weren't being properly scrubbed

## Root Cause

The issue had **two parts**:

### 1. Delete Operation Only Revoked, Didn't Delete
**File:** `src/features/settings/components/LobsterKeysTab.tsx`

The `executeDelete` function was calling `agentService.revoke(id)` instead of actually deleting:
```typescript
// OLD CODE (BROKEN):
const executeDelete = async (id: string) => {
  await agentService.revoke(id);  // Only sets is_active = 0
  setKeys((prev) => prev.filter((k) => k.id !== id));  // UI removes it
};
```

**Problem:** The key still exists in the database with `is_active = 0`, so it reappears on refresh.

### 2. No Actual DELETE Endpoint
**File:** `src/server/routes/agents.ts`

The server only had a `PUT /api/agents/:id/revoke` endpoint that set `is_active = 0`, but no DELETE endpoint to actually remove the key from the database.

## Fix Applied

### 1. Added DELETE Endpoint to Server
**File:** `src/server/routes/agents.ts`

Added a new route:
```typescript
router.delete('/:id', requireAuth, requireHuman, (req: any, res: Response) => {
  const { id } = req.params;
  const userUuid = req.userUuid;

  try {
    const result = db.prepare('DELETE FROM agent_keys WHERE id = ? AND user_uuid = ?').run(id, userUuid);
    // ... audit logging ...
    res.json({ data: { success: true } });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete Lobster key' });
  }
});
```

### 2. Added Delete Method to Agent Service
**File:** `src/services/agents/index.ts`

```typescript
async delete(id: string): Promise<void> {
  await restAdapter.DELETE(`/api/agents/${id}`);
}
```

### 3. Updated Frontend to Use Delete
**File:** `src/features/settings/components/LobsterKeysTab.tsx`

```typescript
const executeDelete = async (id: string) => {
  try {
    await agentService.delete(id);  // Now actually deletes!
    setKeys((prev) => prev.filter((k) => k.id !== id));
  } catch (err) {
    console.error('[LobsterKeysTab] Delete failed:', err);
  } finally {
    setConfirmDeleteId(null);
  }
};
```

## Reset Commands Added

**File:** `package.json`

Added two new commands:

```json
"scuttle:reset": "npm run scuttle:stop && rm -rf dist && rm -rf data && mkdir -p data",
"scuttle:reset-db": "rm -f data/clawstack.db && echo '✅ Database reset. Restart server to recreate schema.'"
```

### Usage:
- `npm run scuttle:reset` - Stop servers, clear build output, delete data directory
- `npm run scuttle:reset-db` - Delete only the database file (keeps data directory)
- `npm run scuttle:dev-stop` - Stop running servers

## Testing

After applying these fixes:

1. **Delete a key**: Key is removed from database (not just marked inactive)
2. **Refresh page**: Key stays deleted (doesn't reappear)
3. **Reset database**: All keys are cleared for fresh start

## Why This Happened

During the Phase 3 migration, the agent service was moved from `src/services/agentService.ts` to `src/services/agents/index.ts`. The original implementation likely had both revoke and delete functionality, but the delete endpoint was either:
- Not properly migrated, or
- Never existed in the first place

The frontend code was using `revoke()` as a proxy for delete, which only deactivated keys rather than removing them.

## Verification

To verify the fix works:

1. Create a new Lobster key
2. Delete it from the settings menu
3. Refresh the page
4. Confirm the key does NOT reappear
5. Optionally, check the database directly:
   ```bash
   sqlite3 data/clawstack.db "SELECT * FROM agent_keys;"
   ```

The deleted key should be completely removed from the database.

---

*Maintained by CrustAgent©™*
*Fix applied: 2026-04-30*
