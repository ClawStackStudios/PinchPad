# Sovereign Error Pattern Analysis

This skill defines the "Debugging Reflex" for the ShellPlate environment. Use it to scan for known codebase friction points whenever things move out of "Vibecheck Green" status.

## 🔍 Lobster-Specific Patterns

### 500 Internal Server Errors (The "Lobster Mismatch")
- **Field Name Drifts**: Check for `expirationType` (Frontend) vs `expiration` (Legacy Backend). Most common after refactoring.
- **ReferenceErrors**: Look for variables renamed in one part of a service but not the other (e.g., `agentService.js`).
- **Parsing Failures**: Verify `JSON.parse` on permission columns. Ensure columns aren't coming back as double-stringified.

### UI & Styling Friction
- **Z-Index Layering**: Dropdowns or tooltips appearing behind modals? Standardize on `z-[110]` for portalled content over `z-[100]` modals.
- **Theme Persistence**: Light/Dark mode "flashes" indicate a mismatch between Tailwind classes and the React theme state provider.

### 🛡️ Auth & Access
- **Token Format**: Always verify the `api-` prefix. Mismatched prefix = immediate 401.
- **EADDRINUSE**: Port `6262` (Backend) or `5757` (Vite) already in use? Use `scuttle-health-monitor` to pinch and clear zombie processes.

## 🛠️ Root Cause Protocol
1. **Live Audit**: Pipe logs to a file (e.g. `node server.js > /tmp/debug.log 2>&1`) to catch the exact stack trace.
2. **Vertical Reproduction**: Use `curl` to trigger the failing endpoint directly, bypassing the UI.
3. **Pinch & Fix**: Propose a fix that addresses the root identity of the error, not just the symptom.
4. **Verified Signature**: Sign all fixes with a successful vibecheck run.

---
*verified by vibecheck*
<!-- vibecheck:context-engine:v2 -->