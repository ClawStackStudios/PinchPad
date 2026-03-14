---
description: Express Stack Patterns — project-specific conventions
alwaysApply: true
priority: 85
---

# Express Stack Patterns

## Project Identity
- **Name**: clawstack-studios
- **Stack**: Express + typescript + node
- **Maturity**: growing (65% score)
- **Structure**: feature-based (98 files, 30 dirs)

## Styling Rules
- Primary: **Tailwind CSS**
- Use Tailwind utility classes — do NOT write custom CSS unless extending the design system
- No design system detected — consider establishing a component library

## Testing Conventions
- Framework: Vitest, Testing Library
- No E2E tests — consider adding for critical paths
- Tests are colocated with source files
- No coverage configured

## Deployment
- Targets: Docker
- Docker is configured — keep Dockerfile updated
- 
- 

---
<!-- vibecheck:context-engine:v2 -->