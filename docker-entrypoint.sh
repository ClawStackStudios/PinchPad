#!/bin/sh
set -e

# Read PUID/PGID from environment, default to 1000 if not set
PUID=${PUID:-1000}
PGID=${PGID:-1000}

# If PGID 1000 already exists (node:22-slim has node user/group at 1000), use existing group
# This prevents "addgroup: The GID `1000' is already in use" error
if getent group "$PGID" > /dev/null 2>&1; then
  EXISTING_GROUP=$(getent group "$PGID" | cut -d: -f1)

  # Create pinchpad user with existing group if pinchpad user doesn't exist
  if ! getent passwd pinchpad > /dev/null 2>&1; then
    adduser --disabled-password --no-create-home --gecos "" \
      --uid "$PUID" --ingroup "$EXISTING_GROUP" pinchpad 2>/dev/null || true
  fi
else
  # GID doesn't exist, create new group and user
  if ! getent group pinchpad > /dev/null 2>&1; then
    addgroup --gid "$PGID" pinchpad
  fi

  if ! getent passwd pinchpad > /dev/null 2>&1; then
    adduser --disabled-password --no-create-home --gecos "" \
      --uid "$PUID" --ingroup pinchpad pinchpad
  fi
fi

# Fix /app/data directory ownership to PUID:PGID
if [ -d /app/data ]; then
  chown -R "$PUID:$PGID" /app/data
fi

# Drop privileges and execute the server as PUID:PGID
exec gosu "$PUID:$PGID" "$@"
