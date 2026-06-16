#!/usr/bin/env bash
set -euo pipefail

# Ensure the script uses the project's pinned Node version when nvm is available.
export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
if [ -s "$NVM_DIR/nvm.sh" ]; then
	. "$NVM_DIR/nvm.sh"
	if [ -f .nvmrc ]; then
		nvm install >/dev/null
		nvm use >/dev/null
	fi
fi

pkill -f "node server.js" 2>/dev/null || true
sleep 0.5
npm install
npx prisma generate
npx prisma migrate deploy

source .env.local

npm run dev
