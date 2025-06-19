#!/bin/sh
cd /app

/usr/local/bin/node main.js

# At the end of the script, rotate the log file
sh /app/logrotate.sh