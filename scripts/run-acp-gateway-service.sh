#!/bin/zsh

set -euo pipefail

export PATH="/Users/litongb/.nvm/versions/node/v24.14.1/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"
export NODE_ENV="${NODE_ENV:-production}"

cd /Users/litongb/dev/ahfu2/acp-gateway

exec /Users/litongb/.nvm/versions/node/v24.14.1/bin/npm run start
