#!/bin/sh
set -e

# If the markers directory in the data volume is missing or empty, populate it
# from the app image copy at /app/markers (this repo's `markers/` folder).
if [ ! -d /data/markers ] || [ -z "$(ls -A /data/markers 2>/dev/null)" ]; then
  echo "Initializing /data/markers from /app/markers..."
  mkdir -p /data/markers
  # Copy all files (preserve attributes where possible)
  if [ -d /app/markers ]; then
    cp -a /app/markers/. /data/markers/ || true
  else
    echo "Warning: /app/markers not found in image; nothing to copy"
  fi
fi

# Ensure permissions are reasonable (best-effort)
chown -R node:node /data/markers 2>/dev/null || true

# Execute the container CMD
exec "$@"
