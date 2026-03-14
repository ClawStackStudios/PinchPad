#!/bin/bash

# scuttle-db-backup script
# Part of the ShellPlate©™ Sovereign Philosophy

DATA_DIR="data"
BACKUP_DIR="$DATA_DIR/backups"
DB_FILE="$DATA_DIR/shellplate.db"
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_FILE="$BACKUP_DIR/shellplate_$TIMESTAMP.db.bak"

echo "🦞 Starting Sovereign Database Pinch..."

# 1. Ensure directories exist
if [ ! -d "$DATA_DIR" ]; then
    echo "❌ Error: Data directory '$DATA_DIR' not found!"
    exit 1
fi

mkdir -p "$BACKUP_DIR"

# 2. Check if DB exists
if [ ! -f "$DB_FILE" ]; then
    echo "❌ Error: Database file '$DB_FILE' not found!"
    exit 1
fi

# 3. Perform the pinch
cp "$DB_FILE" "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo "✅ Success: Database pinched to $BACKUP_FILE"
    # Keep only the last 10 backups to prevent bloat
    ls -t "$BACKUP_DIR"/*.db.bak | tail -n +11 | xargs -r rm
    echo "🧹 Old shells cleaned. Retaining last 10 pinches."
else
    echo "❌ Error: Pinch failed!"
    exit 1
fi
