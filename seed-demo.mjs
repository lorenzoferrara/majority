// seed-demo.mjs  – creates a demo poll with 10 options and 8 voters
// Run with:  node seed-demo.mjs

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const MONTH = "Demo – April 2026";

const OPTIONS = [
  { label: "Oppenheimer",         description: "Christopher Nolan, 2023" },
  { label: "Past Lives",          description: "Celine Song, 2023" },
  { label: "Anatomy of a Fall",   description: "Justine Triet, 2023" },
  { label: "The Zone of Interest",description: "Jonathan Glazer, 2023" },
  { label: "Poor Things",         description: "Yorgos Lanthimos, 2023" },
  { label: "All of Us Strangers", description: "Andrew Haigh, 2023" },
  { label: "Saltburn",            description: "Emerald Fennell, 2023" },
  { label: "Killers of the Flower Moon", description: "Martin Scorsese, 2023" },
  { label: "Priscilla",           description: "Sofia Coppola, 2023" },
  { label: "May December",        description: "Todd Haynes, 2023" },
];

// Each voter: name + their ranking (array of 0-based option indices, 1st = top choice)
const VOTERS = [
  { name: "Alice",   ranking: [0, 2, 4, 1, 6, 3, 5, 7, 8, 9] },
  { name: "Bob",     ranking: [4, 0, 3, 2, 1, 5, 8, 9, 7, 6] },
  { name: "Carla",   ranking: [2, 4, 0, 5, 3, 1, 9, 6, 7, 8] },
  { name: "Diego",   ranking: [1, 3, 0, 4, 2, 6, 7, 5, 8, 9] },
  { name: "Eva",     ranking: [3, 0, 2, 4, 5, 1, 6, 8, 9, 7] },
  { name: "Frank",   ranking: [4, 2, 1, 0, 3, 7, 5, 6, 8, 9] },
  { name: "Giulia",  ranking: [0, 4, 3, 2, 1, 6, 9, 8, 5, 7] },
  { name: "Hiroshi", ranking: [5, 4, 0, 3, 2, 1, 7, 6, 8, 9] },
];

async function main() {
  // Clean up any existing demo poll
  await prisma.poll.deleteMany({ where: { month: MONTH } });

  // Create poll + options
  const poll = await prisma.poll.create({
    data: {
      month: MONTH,
      status: "CLOSED",
      options: {
        create: OPTIONS.map((o, i) => ({ ...o, order: i })),
      },
    },
    include: { options: { orderBy: { order: "asc" } } },
  });

  console.log(`Created poll: ${poll.id}`);

  // Create ballots
  for (const voter of VOTERS) {
    const ballot = await prisma.ballot.create({
      data: {
        pollId: poll.id,
        userId: voter.name,
        submittedAt: new Date(Date.now() - Math.random() * 3600_000),
        choices: {
          create: voter.ranking.map((optIdx, rank) => ({
            optionId: poll.options[optIdx].id,
            rank: rank + 1,
          })),
        },
      },
    });
    console.log(`  Ballot for ${voter.name}: ${ballot.id}`);
  }

  console.log(`\nDone! Poll ID: ${poll.id}`);
  console.log(`Open: http://localhost:5173/results/${poll.id}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
