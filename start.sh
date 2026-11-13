#!/bin/bash
# CampusFind launcher  ->  run with:  bash start.sh
# Works on a fresh machine (needs Node.js 18+ and internet). It will:
#   1. install dependencies on first run
#   2. start the backend (local if backend/.env is configured, otherwise the hosted API)
#   3. start the frontend and open the Electron desktop app

cd "$(dirname "$0")" || exit 1

# Hosted backend used when no local database is configured
HOSTED_API="${CAMPUSFIND_HOSTED_API:-https://campusfind-8yl6.onrender.com}"

need() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "ERROR: '$1' is required but not installed. Install Node.js 18+ from https://nodejs.org and run again."
    exit 1
  }
}
need node; need npm; need curl

# 1. First-run dependency install
for dir in backend frontend; do
  if [ ! -d "$dir/node_modules" ]; then
    echo "Installing $dir dependencies (first run only, may take a few minutes)..."
    (cd "$dir" && npm install --no-audit --no-fund) || { echo "ERROR: npm install failed in $dir"; exit 1; }
  fi
done

# 2. Decide which backend to use
USE_LOCAL=0
if [ "$USE_LOCAL_BACKEND" = "0" ]; then
  USE_LOCAL=0                      # forced hosted mode
elif [ "$USE_LOCAL_BACKEND" = "1" ]; then
  USE_LOCAL=1
elif [ -f backend/.env ] && grep -Eq '^(DATABASE_URL|DB_HOST|DB_NAME)=.+' backend/.env; then
  USE_LOCAL=1
fi

PIDS=""
cleanup() { for p in $PIDS; do kill "$p" 2>/dev/null; done; }
trap cleanup EXIT INT TERM

wait_for() {  # wait_for <url> <label> <max-seconds>
  local url="$1" label="$2" limit="$3" t=0
  echo "Waiting for $label..."
  until curl -fsS --max-time 10 "$url" >/dev/null 2>&1; do
    t=$((t + 2))
    if [ "$t" -ge "$limit" ]; then echo "WARNING: $label did not respond within ${limit}s."; return 1; fi
    sleep 2
  done
  echo "$label is ready."
}

port_busy() { curl -s --max-time 2 -o /dev/null "http://localhost:$1" 2>/dev/null; }
if port_busy 5173; then
  echo "ERROR: something is already running on port 5173 (probably an old CampusFind session)."
  echo "Stop it first, e.g.:  lsof -ti:5173,3001 | xargs kill     then run  bash start.sh  again."
  exit 1
fi
if [ "$USE_LOCAL" = "1" ] && port_busy 3001; then
  echo "ERROR: something is already running on port 3001 (an old backend). Stop it first:  lsof -ti:3001 | xargs kill"
  exit 1
fi

if [ "$USE_LOCAL" = "1" ]; then
  echo "Backend mode: LOCAL (database from backend/.env)"
  (cd backend && npm start) &
  PIDS="$PIDS $!"
  API_TARGET="http://localhost:3001"
  wait_for "$API_TARGET/api/health" "local backend" 60
else
  echo "Backend mode: HOSTED ($HOSTED_API)"
  echo "The hosted server may be asleep; waking it up (can take up to a minute)..."
  API_TARGET="$HOSTED_API"
  wait_for "$API_TARGET/api/health" "hosted backend" 180
fi

# 3. Frontend (its dev server proxies /api to the chosen backend)
(cd frontend && API_PROXY_TARGET="$API_TARGET" npm run dev -- --strictPort) &
PIDS="$PIDS $!"
wait_for "http://localhost:5173/api/health" "frontend" 90

# 4. Desktop app
FLAGS=""
[ "$(uname)" = "Linux" ] && FLAGS="--no-sandbox"
echo "Launching Electron..."
(cd frontend && env -u ELECTRON_RUN_AS_NODE npx electron $FLAGS ../electron/main.js) &
ELECTRON_PID=$!
PIDS="$PIDS $ELECTRON_PID"

# Closing the desktop window stops everything
wait "$ELECTRON_PID"