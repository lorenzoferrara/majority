# Monthly Oscar-Style Ranked-Choice Voting App

## Stack
- **Framework**: Next.js 14 (App Router) + TypeScript
- **Database**: PostgreSQL via Neon (free tier) + Prisma ORM
- **Auth**: Clerk (free tier, 10k MAU)
- **Hosting**: Vercel (Hobby tier)
- **DnD**: @dnd-kit/core + @dnd-kit/sortable

## Project Structure
```
src/
├── app/
│   ├── (auth)/           # Clerk sign-in/up pages
│   ├── admin/
│   │   └── polls/        # Poll CRUD (admin only)
│   ├── polls/
│   │   └── [pollId]/     # Voting page
│   └── results/
│       └── [pollId]/     # Results + IRV calculation
├── components/
│   ├── RankingBoard.tsx   # @dnd-kit drag-and-drop
│   └── ResultsChart.tsx
├── lib/
│   ├── irv.ts            # Instant-Runoff algorithm
│   └── prisma.ts         # Prisma singleton
├── actions/
│   ├── polls.ts          # Server Actions: CRUD
│   └── votes.ts          # Server Actions: submit/calculate
└── prisma/
    └── schema.prisma
```
