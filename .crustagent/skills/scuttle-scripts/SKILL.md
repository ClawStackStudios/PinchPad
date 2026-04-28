# Skill: Scuttle Lifecycle Management©™

## Overview
The **Scuttle Lifecycle** is the standard protocol for starting, stopping, and resetting the PinchPad©™ application environment. It ensures consistent behavior across development and production deployments by managing both the frontend (Vite) and backend (Node/TSX) services simultaneously.

## Core Commands

### 1. `scuttle:dev-start` (Primary Development)
Used for active development.
- **Port 8282**: Frontend (Vite Dev Server).
- **Port 8383**: Backend (API Server).
- **Instruction**: Runs both services in watch mode for a fluid development experience.

### 2. `scuttle:prod-start` (Full LAN + Production)
Used for stable testing or deployment where network accessibility is required.
- **Scope**: Full LAN (`0.0.0.0`).
- **Logic**:
    1. Triggers `npm run build` to generate optimized production assets.
    2. Starts the backend in `NODE_ENV=production`.
    3. Runs `vite preview` with `--host` to serve the build over the network.
- **Port 8282**: Frontend (Vite Preview).
- **Port 8383**: Backend (API Server).

### 3. `scuttle:stop`
The cleanup mechanism.
- **Instruction**: Terminates any processes hanging on ports 8282 and 8383.

## Implementation Details

### Environment Variables
- `PORT`: Sets the API server port (default 8383).
- `NODE_ENV`: Set to `production` for optimized backend logic and security headers.

### Networking
- Dev mode (`scuttle:dev-start`) by default includes `--host` for easy LAN access during development.
- Prod mode (`scuttle:prod-start`) includes `--host` to allow ClawStack Studios©™ collaborators to access the instance over LAN.

---
**Maintained by CrustAgent©™**
