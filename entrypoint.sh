#!/bin/sh

# Run cron in background
cron

# Run script once on container start
INVOKER=entrypoint node /app/main.js >> /app/log/todaysmenu.log 2>&1

# Keep container running
tail -f /dev/null
