<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />

# 🦞 PinchPad©™

[![Status](https://img.shields.io/badge/Status-Hatched-red?style=for-the-badge)](https://github.com/ClawStackStudios/PinchPad)
[![Version](https://img.shields.io/badge/Version-1.0.0--prototype-cyan?style=for-the-badge)](https://github.com/ClawStackStudios/PinchPad)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)
[![Vite](https://img.shields.io/badge/Vite-6.x-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-19.x-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)

**Secure Agent Management and Note-taking platform built on the Lobsterized©™ ethos.**
</div>

---

## 🌊 The Reef Ecosystem

PinchPad is a sovereign lobster pot designed for the modern web. It protects your ideas with client-side encryption while allowing you to delegate granular access to autonomous agents. No passwords, no emails—just your claws and your keys.

### 🏗️ Architecture Flow

```mermaid
graph TD
    A[Human / Agent] -->|hu- / lb- Key| B(Auth Middleware)
    B -->|Verified| C{Lobster Pot}
    C -->|AES-256-GCM| D[ShellCryption Service]
    D -->|Encrypted Pearl| E[(ClawStack DB)]
    C -->|Lobsterized Logic| F[Agent Service]
    F -->|lb- Keys| G[Delegated Agents]
```
...
## 🦞 Feature Exoskeleton

```ascii
[ PINCHPAD CORE ]
       |
       +--- [ 🔒 ClawKeys©™ ] : Decentralized identity keys (hu-) generated client-side.
       |
       +--- [ 🐚 ShellCryption©™ ] : Zero-knowledge AES-256-GCM encryption for notes.
       |
       +--- [ 🦞 LobsterKeys©™ ] : Granular, revocable API keys (lb-) for Agent access.
       |
       +--- [ 🗄️ Secure Reef ] : Persistent SQLite storage with Volume binding.
       |
       +--- [ 🌓 MoltTheme ] : High-performance View Transition theme engine.
```

       +--- [ 🌓 MoltTheme ] : High-performance View Transition theme engine.
```

---

## 🚀 Quick Start (Molt into Action)

### 🛠️ Local Development (Bare Metal)

**Prerequisites:** Node.js (v22+)

1.  **Clone the Reef:**
    ```bash
    git clone https://github.com/ClawStackStudios/PinchPad.git
    cd PinchPad
    ```

2.  **Initialize Habitat:**
    ```bash
    npm install
    cp .env.example .env.local
    # Edit .env.local and add your GEMINI_API_KEY
    ```

3.  **Hatch the Server:**
    ```bash
    npm run dev
    ```

### 🐳 Docker Deployment (Containerized)

**Prerequisites:** Docker & Docker Compose

1.  **Build and Run:**
    ```bash
    docker-compose up --build -d
    ```

2.  **Volume Persistence:**
    Your data is stored in `./data/clawstack.db`. This is bound to the container for persistent storage across molts.

---

## 📜 Documentation Habitat

<details>
<summary>📂 View Project Artifacts</summary>

- [🏗️ BLUEPRINT.md](./BLUEPRINT.md) - ASCII Architecture & System Flow.
- [🗺️ ROADMAP.md](./ROADMAP.md) - Future molts and planned features.
- [🤝 CONTRIBUTING.md](./CONTRIBUTING.md) - How to help the reef grow.
- [🛡️ SECURITY.md](./SECURITY.md) - Security policies and reporting.
</details>

---

## 🛠️ NPC Commands (NPM Scripts)

| Command | Action |
| :--- | :--- |
| `npm run dev` | Starts the Express + Vite dev server. |
| `npm run build` | Builds the production "Hard Shell" dist. |
| `npm run preview` | Previews the production build locally. |
| `npm run lint` | Scans the exoskeleton for type errors. |
| `npm run clean` | Purges the `dist` directory. |

---

<div align="center">
<i>Built with ❤️ by Lucas and Gemini CLI</i><br>
<b>© 2026 ClawStack Studios. Stay Grounded. Stay Crusty.</b>
</div>
