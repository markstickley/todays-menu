#!/bin/sh

LOG_FILE="/app/log/todaysmenu.log"

# Export environment variables for cron jobs in a shell-compatible way
( printenv | grep -v "^no_proxy=" | while IFS='=' read -r name value; do
    [ -z "$name" ] && continue
    esc_value=$(printf '%s' "$value" | sed 's/\\/\\\\/g; s/\"/\\\"/g')
    printf 'export %s="%s"\n' "$name" "$esc_value"
done ) > /etc/profile.d/envvars.sh

# Run cron in background
cron

# Check if cron started successfully
if pgrep cron > /dev/null; then
  echo $(date) "Cron started successfully." >> "$LOG_FILE"
else
  echo $(date) "Cron failed to start!" >> "$LOG_FILE"
  exit 1
fi

# Run script once on container start
INVOKER=entrypoint node /app/main.js >> "$LOG_FILE" 2>&1

# Rotate log file
sh /app/logrotate.sh

# Keep container running
tail -f /dev/null
