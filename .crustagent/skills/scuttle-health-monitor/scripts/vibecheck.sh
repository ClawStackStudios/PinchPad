#!/bin/bash

# scuttle-health-monitor script
# Part of the ShellPlate©™ Sovereign Philosophy

FRONTEND_PORT=5757
BACKEND_PORT=6262

echo "🦞 Initiating ShellPlate Vibecheck..."

# 1. Check Frontend Port
if lsof -Pi :$FRONTEND_PORT -sTCP:LISTEN -t >/dev/null ; then
    PID=$(lsof -t -i:$FRONTEND_PORT)
    echo "✅ Frontend (:$FRONTEND_PORT) is UP (PID: $PID)"
else
    echo "❌ Frontend (:$FRONTEND_PORT) is DOWN!"
fi

# 2. Check Backend Port
if lsof -Pi :$BACKEND_PORT -sTCP:LISTEN -t >/dev/null ; then
    PID=$(lsof -t -i:$BACKEND_PORT)
    echo "✅ Backend (:$BACKEND_PORT) is UP (PID: $PID)"
else
    echo "❌ Backend (:$BACKEND_PORT) is DOWN!"
fi

# 3. Check Database
if [ -f "data/shellplate.db" ]; then
    echo "✅ Database file exists."
    # Basic integrity check (if sqlite3 is available)
    if command -v sqlite3 &> /dev/null; then
        VAL=$(sqlite3 data/shellplate.db "PRAGMA integrity_check;")
        if [ "$VAL" == "ok" ]; then
            echo "✅ Database integrity: OK"
        else
            echo "⚠️ Database integrity: $VAL"
        fi
    fi
else
    echo "❌ Database file MISSING!"
fi

echo "🦞 Vibecheck Complete."
