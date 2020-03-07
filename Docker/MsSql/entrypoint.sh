#!/usr/bin/env bash

set -Ee

trap "Error on line $LINENO" ERR

if [[ "$SA_PASSWORD" == "" && "$DB_SA_PASSWORD_FILE" != "" && -e $DB_SA_PASSWORD_FILE ]]; then
    password="$(< "${DB_SA_PASSWORD_FILE}")"
    export SA_PASSWORD="$password"
fi

/opt/mssql/bin/sqlservr