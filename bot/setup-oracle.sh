#!/usr/bin/env bash
set -euo pipefail

APP="$HOME/andosuave-bot"

echo "==> Instalando Node.js 22 (NodeSource)"
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs git || { sudo apt-get update -y && sudo apt-get install -y nodejs git; }

echo "==> Versiones"
node -v
npm -v

if [ ! -f "$APP/.env" ]; then
  echo "==> Creando .env desde la plantilla"
  cp "$APP/.env.example" "$APP/.env"
  echo ""
  echo "   ⚠️  Edita ahora: $APP/.env"
  echo "      (pon ADMIN_NUMBERS, GROUP_ID, PAIRING_NUMBER y GITHUB_TOKEN)"
  echo "      y cuando termines vuelve a correr: bash setup-oracle.sh"
  exit 1
fi

if [ ! -d "$APP/node_modules" ]; then
  echo "==> Instalando dependencias"
  cd "$APP"
  npm install
fi

echo "==> Instalando pm2"
sudo npm install -g pm2

echo "==> Arrancando bot con pm2"
cd "$APP"
pm2 delete andosuave-bot 2>/dev/null || true
pm2 start src/index.js --name andosuave-bot
pm2 save
pm2 startup systemd -u "$USER" --hp "$HOME" 2>/dev/null | tail -1 | bash || true

echo ""
echo "✅ Desplegado."
echo "   Ver logs (QR / pairing code):  pm2 logs andosuave-bot --lines 50"
echo "   Reiniciar:                      pm2 restart andosuave-bot"
echo "   Estado:                         pm2 status"