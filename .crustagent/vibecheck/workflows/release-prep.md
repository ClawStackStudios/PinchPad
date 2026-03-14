# Release Prep

Full audit → fixes → deploy → PR

Run agents in .crustagent/vibecheck/agents

## Agents

- code-auditor
- security-auditor
- dep-auditor
- fix-planner
- code-fixer
- deploy-checker
- pr-writer

## Execution

Run the agents in sequence (or parallel where noted). Collect all outputs in `.claude/audits/`.
