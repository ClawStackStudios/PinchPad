# Scuttle-Skill: scuttle-db-backup

A Sovereign AgentSkill designed to safely pinch (backup) the SQLite database (`data/shellplate.db`) without interrupting active sessions.

## 🦞 Philosophy
- **Sovereign**: Backups are stored locally and timestamped.
- **Secure**: Only the `data/` directory is touched.
- **Statistically Sound**: Uses simple file-system copy to preserve SQLite integrity for quick restores.

## 🛠️ Usage
Execute the backup script via terminal:
```bash
bash .crustagent/skills/scuttle-db-backup/scripts/backup.sh
```

## 📜 Instructions
1. Always check that the `data/` directory exists before backing up.
2. Create the `data/backups/` directory if it's missing.
3. Use `ISO 8601` timestamping for backup filenames.
4. If a backup fails, alert the user immediately.

*verified by vibecheck*
