#!/bin/bash
# Start CampusFind with a worldwide secure Cloudflare Tunnel

cd "$(dirname "$0")" || exit 1

echo "Starting Backend..."
(cd backend && node src/server.js) &
BACKEND_PID=$!

echo "Starting Frontend..."
(cd frontend && npx vite --host 0.0.0.0 --port 5173) &
FRONTEND_PID=$!

echo "Waiting for local servers..."
until curl -fsS http://localhost:5173/ >/dev/null 2>&1; do
  sleep 1
done

echo "Starting Cloudflare Tunnel..."
/opt/homebrew/bin/cloudflared tunnel --url http://localhost:5173 2>&1 | while read -r line; do
  echo "$line"
  if [[ "$line" =~ https://[a-zA-Z0-9-]+\.trycloudflare\.com ]]; then
    URL=$(echo "$line" | grep -oE "https://[a-zA-Z0-9-]+\.trycloudflare\.com")
    echo ""
    echo "=========================================================="
    echo "  🎉 CampusFind is LIVE globally at: $URL"
    echo "  Open this link on ANY device, mobile data, or Wi-Fi!"
    echo "=========================================================="
    echo ""
  fi
done &
TUNNEL_PID=$!

trap 'kill $BACKEND_PID $FRONTEND_PID $TUNNEL_PID 2>/dev/null' EXIT
wait
