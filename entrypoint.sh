#!/bin/sh

# Run cron in background
cron

# Run script once on container start
node /app/main.js

# Keep container running
tail -f /dev/null
