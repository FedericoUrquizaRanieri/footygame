#!/bin/sh
# Se ejecuta una sola vez, al crear el volumen de datos por primera vez.
set -e
psql -v ON_ERROR_STOP=1 -U postgres -d postgres \
  -v admin_pw="$FOOTYGAME_ADMIN_PASSWORD" \
  -v app_pw="$FOOTYGAME_APP_PASSWORD" \
  -f /setup/setup.sql
