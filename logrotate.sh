#!/bin/sh
# logrotate.sh - keep only the 20 most recent lines of the log file

LOG_FILE="/app/log/todaysmenu.log"

# Only rotate if the log file exists
test -f "$LOG_FILE" && tail -n 20 "$LOG_FILE" > "$LOG_FILE.tmp" && mv "$LOG_FILE.tmp" "$LOG_FILE"
