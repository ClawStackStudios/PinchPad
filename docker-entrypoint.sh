#!/bin/sh
set -e

# Read PUID/PGID from environment, default to 1000 if not set
PUID=${PUID:-1000}
PGID=${PGID:-1000}

# Create group if it doesn't exist
if ! getent group pinchpad > /dev/null 2>&1; then
  addgroup --gid "$PGID" pinchpad
fi

# Create user if it doesn't exist
if ! getent passwd pinchpad > /dev/null 2>&1; then
  adduser --disabled-password --no-create-home --gecos "" \
    --uid "$PUID" --ingroup pinchpad pinchpad
fi

# Fix /app/data directory ownership to PUID:PGID
if [ -d /app/data ]; then
  chown -R "$PUID:$PGID" /app/data
fi

# Drop privileges and execute the server as pinchpad user
exec gosu "$PUID:$PGID" "$@"
