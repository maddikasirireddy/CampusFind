#!/bin/bash
cd "$(dirname "$0")" || exit 1

(cd backend && npm run dev) &
BACKEND_PID=$!

(cd frontend && npm run dev -- --strictPort) &
FRONTEND_PID=$!

echo "Waiting for frontend..."
until curl -fsS http://localhost:5173/ >/dev/null; do
  sleep 1
done

echo "Launching Electron..."
(cd frontend && env -u ELECTRON_RUN_AS_NODE npx electron ../electron/main.js) &
ELECTRON_PID=$!

trap 'kill $BACKEND_PID $FRONTEND_PID $ELECTRON_PID 2>/dev/null' EXIT
wait
