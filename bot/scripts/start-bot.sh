#!/bin/bash
# Arranque continuo del bot AndoSuave (lo usa launchd).
cd "$(dirname "$0")/.."
NODE="$HOME/.nvm/versions/node/v24.19.0/bin/node"
[ -x "$NODE" ] || NODE="$(command -v node)"
exec "$NODE" src/index.js