# PinchPad Architecture Blueprint

```ascii
                                     [ CLIENT ]
                                         |
                                         V
                                [ VITE DEV SERVER / EXPRESS ]
                                         |
          +------------------------------+------------------------------+
          |                              |                              |
    [ AUTH SYSTEM ]                [ POT SYSTEM ]                [ AGENT SYSTEM ]
   (ClawKeys©™ hu-)              (ShellCryption©™)              (LobsterKeys©™ lb-)
          |                              |                              |
          V                              V                              V
    +-----------+                  +-----------+                  +-----------+
    |  ROUTES   |                  |  ROUTES   |                  |  ROUTES   |
    | (auth.ts) |                  | (notes.ts)|                  | (agents.ts)|
    +-----------+                  +-----------+                  +-----------+
          |                              |                              |
          V                              V                              V
    +-----------+                  +-----------+                  +-----------+
    | SERVICES  |                  | SERVICES  |                  | SERVICES  |
    |(authService)|                |(noteService)|                |(agentService)|
    +-----------+                  +-----------+                  +-----------+
          |                              |                              |
          +------------------------------+------------------------------+
                                         |
                                         V
                                 [ BETTER-SQLITE3 ]
                                   (clawstack.db)
```

## System Overview

- **Frontend:** React + TypeScript + Vite + TailwindCSS 4
- **Backend:** Node.js + Express + TSX
- **Database:** SQLite (via `better-sqlite3`)
- **Security:**
  - **ClawKeys©™:** Decentralized identity keys (`hu-`) generated client-side.
  - **ShellCryption©™:** Client-side AES-256-GCM encryption for notes.
  - **LobsterKeys©™:** Granular API keys (`lb-`) for agent access.
- **Infrastructure:** Docker-ready with volume binding for persistent data.

## Directory Structure

```ascii
PinchPad/
├── src/
│   ├── components/      # (Planned) Reusable UI components
│   ├── pages/           # (Planned) Page views
│   ├── services/        # Frontend business logic & API calls
│   ├── lib/             # Core crypto and utility functions
│   └── server/          # Backend implementation
│       ├── routes/      # Express API endpoints
│       ├── middleware/  # Security and Auth middleware
│       └── db.ts        # Database schema and connection
├── data/                # SQLite database persistence (Volume)
├── public/              # Static assets
├── server.ts            # Entry point (Server + Vite Middleware)
└── Dockerfile           # Container definition
```
