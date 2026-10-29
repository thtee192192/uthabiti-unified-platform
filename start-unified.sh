#!/usr/bin/env bash

set -e

ROOT_DIR="/data/data/com.termux/files/home/platform"
MAMA_DIR="$ROOT_DIR/mamaplus"
SACCO_DIR="$ROOT_DIR/collaborative-sacco"
NFW_DIR="$ROOT_DIR/nfw-uthabiti"
CAC_DIR="$ROOT_DIR/cac-uthabiti"

PORT_API=5000
PORT_MAMAPLUS=5001
PORT_SACCO=5002
PORT_NFW=5003
PORT_UTBMAIN=5004
PORT_CAC=5005

# Start legacy API server in the background
(cd "$ROOT_DIR" && PORT=$PORT_API node x.js > "$ROOT_DIR/.legacy-server.log" 2>&1) &
API_PID=$!

# Start MamaPlus app in the background with webpack mode
(cd "$MAMA_DIR" && \
  PORT=$PORT_MAMAPLUS \
  LEGACY_API_URL="http://127.0.0.1:$PORT_API" \
  NEXT_PUBLIC_LEGACY_DASHBOARD_URL="http://127.0.0.1:$PORT_API/dashboard.html" \
  pnpm dev --webpack --hostname 0.0.0.0 > "$ROOT_DIR/.mamaplus.log" 2>&1) &
MAMA_PID=$!

# Start collaborative SACCO app in the background with webpack mode
(cd "$SACCO_DIR" && \
  PORT=$PORT_SACCO \
  NEXT_PUBLIC_LEGACY_API_URL="http://127.0.0.1:$PORT_API" \
  pnpm dev --webpack --hostname 0.0.0.0 > "$ROOT_DIR/.collaborative-sacco.log" 2>&1) &
SACCO_PID=$!

# Start NFW Uthabiti app in the background and route auth through the legacy account system
(cd "$NFW_DIR" && \
  PORT=$PORT_NFW \
  LEGACY_API_URL="http://127.0.0.1:$PORT_API" \
  NEXT_PUBLIC_LEGACY_API_URL="http://127.0.0.1:$PORT_API" \
  pnpm dev --webpack --hostname 0.0.0.0 > "$ROOT_DIR/.nfw-uthabiti.log" 2>&1) &
NFW_PID=$!

# Start UTB main app in the background and route auth through the legacy account system
(cd "$ROOT_DIR/utbmain" && \
  PORT=$PORT_UTBMAIN \
  LEGACY_API_URL="http://127.0.0.1:$PORT_API" \
  NEXT_PUBLIC_LEGACY_API_URL="http://127.0.0.1:$PORT_API" \
  pnpm dev --webpack --hostname 0.0.0.0 > "$ROOT_DIR/.utbmain.log" 2>&1) &
UTBMAIN_PID=$!

# Start CAC Uthabiti app in the background and route auth through the legacy account system
(cd "$CAC_DIR" && \
  PORT=$PORT_CAC \
  LEGACY_API_URL="http://127.0.0.1:$PORT_API" \
  NEXT_PUBLIC_LEGACY_API_URL="http://127.0.0.1:$PORT_API" \
  pnpm dev --webpack --hostname 0.0.0.0 > "$ROOT_DIR/.cac-uthabiti.log" 2>&1) &
CAC_PID=$!

echo "Legacy API: http://localhost:$PORT_API"
echo "MamaPlus app: http://localhost:$PORT_MAMAPLUS"
echo "Collaborative SACCO: http://localhost:$PORT_SACCO"
echo "NFW Uthabiti app: http://localhost:$PORT_NFW"
echo "UTB Main app: http://localhost:$PORT_UTBMAIN"
echo "CAC Uthabiti app: http://localhost:$PORT_CAC"
echo "API PID: $API_PID"
echo "MamaPlus PID: $MAMA_PID"
echo "SACCO PID: $SACCO_PID"
echo "NFW PID: $NFW_PID"
echo "UTB Main PID: $UTBMAIN_PID"
echo "CAC PID: $CAC_PID"
echo "Logs:"
echo "  - $ROOT_DIR/.legacy-server.log"
echo "  - $ROOT_DIR/.mamaplus.log"
echo "  - $ROOT_DIR/.collaborative-sacco.log"
echo "  - $ROOT_DIR/.nfw-uthabiti.log"
echo "  - $ROOT_DIR/.utbmain.log"
echo "  - $ROOT_DIR/.cac-uthabiti.log"

echo ""
echo "Press Ctrl+C to stop all services"

trap 'kill $API_PID $MAMA_PID $SACCO_PID $NFW_PID $UTBMAIN_PID $CAC_PID' INT TERM
wait $API_PID $MAMA_PID $SACCO_PID $NFW_PID $UTBMAIN_PID $CAC_PID
