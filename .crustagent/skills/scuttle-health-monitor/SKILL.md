# Scuttle-Skill: scuttle-health-monitor

A Sovereign AgentSkill designed to scuttle through the environment and ensure the ShellPlate ports (`5757` and `6262`) are healthy and unobstructed.

## 🦞 Philosophy
- **Vibecheck First**: If the ports are dead, the app is dead.
- **Statistically Sound**: Checks both network reachability and process existence.
- **Fail-Fast**: Reports immediately if port conflicts are detected.

## 🛠️ Usage
Execute the vibecheck script via terminal:
```bash
bash .crustagent/skills/scuttle-health-monitor/scripts/vibecheck.sh
```

## 📜 Instructions
1. Check port `5757` (Vite/Production Frontend).
2. Check port `6262` (Express Backend).
3. Use `fuser` or `lsof` to identify which PIDs are hogging the ports.
4. Verify the database connection is alive.

*verified by vibecheck*
