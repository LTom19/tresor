#!/bin/sh
set -e
node /app/dist/migrate.js
exec node /app/dist/index.js
