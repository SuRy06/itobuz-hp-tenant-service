#!/bin/sh -e
# export fetched secrets as env vars
SECRETS_DIR="/mnt/secrets"
if [ -d $SECRETS_DIR ]; then
  secrets=$(ls $SECRETS_DIR)
  for f in $secrets; do
    echo "Read $f"
    export "$f"="$(cat $SECRETS_DIR/${f})"
    echo "$f"="$(cat $SECRETS_DIR/${f})" >> .env
  done
fi

npm run prod-run