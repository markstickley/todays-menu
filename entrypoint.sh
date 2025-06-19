#!/bin/sh

# Export environment variables for cron jobs in a shell-compatible way
printenv | grep -v "no_proxy" | awk -F= '{gsub("'\"'", "\\\"", $2); print "export "$1"=\""$2"\""}' > /etc/profile.d/envvars.sh

# Run cron in background
cron

# Run script once on container start
INVOKER=entrypoint node /app/main.js >> /app/log/todaysmenu.log 2>&1

# Keep container running
tail -f /dev/null
