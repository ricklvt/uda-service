#!/bin/bash

if test "$1" = "-d"; then
  # NODE_EXTRA_CA_CERTS=keys/local.ca.crt node --inspect-brk -r ts-node/register -r ./dist/bootstrap.js src/main.ts
  tsc --noEmit && exec tsx --inspect-brk --require ./src/bootstrap.ts src/main.ts
fi

# NODE_EXTRA_CA_CERTS=keys/local.ca.crt exec node -r ts-node/register -r ./dist/bootstrap.js src/main.ts
tsc --noEmit && exec tsx --require ./src/bootstrap.ts src/main.ts
