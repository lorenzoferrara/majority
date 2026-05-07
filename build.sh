pkill -f "node server.js" 2>/dev/null || true
sleep 0.5
npm install
npx prisma generate
npx prisma migrate deploy

source .env.local

npm run dev
