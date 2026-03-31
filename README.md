# Ranked-Choice Voting (Vite)

## Stack
- Framework: Vite + React + TypeScript
- Styling: Tailwind CSS
- Data layer: Prisma + PostgreSQL
- Testing: Vitest

## Scripts
- `npm run dev` - start Vite dev server
- `npm run build` - production build with Vite
- `npm run preview` - preview built app locally
- `npm run test` - run Vitest suite

## Structure
- `src/` - Vite React frontend
- `lib/irv.ts` - instant-runoff voting logic
- `lib/irv.test.ts` - IRV tests
- `prisma/` - schema and migrations
