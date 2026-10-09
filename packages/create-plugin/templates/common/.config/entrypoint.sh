#!/bin/sh

# Default to development mode; switch to production when DEV=false
if [ "${DEV}" = "false" ]; then
    export GF_DEFAULT_APP_MODE="production"
fi

if [ "${DEV}" = "false" ]; then
    echo "Starting test mode"
    exec /run.sh
fi

echo "Starting development mode"

if grep -i -q alpine /etc/issue; then
    exec /usr/bin/supervisord -c /etc/supervisord.conf
elif grep -i -q ubuntu /etc/issue; then
    exec /usr/bin/supervisord -c /etc/supervisor/supervisord.conf
else
    echo 'ERROR: Unsupported base image'
    exit 1
fi

