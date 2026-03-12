# Docker Skills — ClawChives©™

> See the full Docker build pipeline skill:
> **`project/skills/build-pipeline/SKILL.md`**

## Quick Reference

```bash
# Local dev build (builds from source)
docker-compose -f docker-compose.dev.yml down
docker-compose -f docker-compose.dev.yml build --no-cache
docker-compose -f docker-compose.dev.yml up -d

# Pull published GHCR image (production)
docker-compose up -d

# Verify
curl -sI http://192.168.1.6:4545/ | grep content-security-policy
docker exec clawchives wc -c /app/dist/assets/*.css
docker logs clawchives --tail=20
```