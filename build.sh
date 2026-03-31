npm install
npx prisma generate
npx prisma migrate deploy
pkill -f "node server.js" 2>/dev/null || true
npm run dev