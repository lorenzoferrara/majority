const { PrismaClient } = require("@prisma/client");

const prisma = global.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") global.prisma = prisma;

module.exports = async function handler(req, res) {
  const pollId = req.query.pollId;

  // ── GET /api/polls/:pollId ──────────────────────────────────────────────
  if (req.method === "GET") {
    const { userId } = req.query;

    try {
      const poll = await prisma.poll.findUnique({
        where: { id: pollId },
        include: {
          options: { orderBy: { order: "asc" } },
          ...(userId
            ? {
                ballots: {
                  where: { userId },
                  include: { choices: { orderBy: { rank: "asc" } } },
                },
              }
            : {}),
        },
      });

      if (!poll) return res.status(404).json({ error: "Poll not found" });

      const existingRanking = poll.ballots?.[0]?.choices.map((c) => c.optionId) ?? null;

      return res.status(200).json({ ...poll, existingRanking });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Failed to fetch poll" });
    }
  }

  // ── POST /api/polls/:pollId — submit ballot ─────────────────────────────
  if (req.method === "POST") {
    const { userId, ranking } = req.body;

    if (!userId || !Array.isArray(ranking) || ranking.length === 0) {
      return res.status(400).json({ error: "userId and ranking array are required" });
    }

    try {
      // Upsert: delete existing ballot if present, then create fresh
      await prisma.ballot.deleteMany({ where: { pollId, userId } });

      const ballot = await prisma.ballot.create({
        data: {
          pollId,
          userId,
          choices: {
            create: ranking.map((optionId, i) => ({
              optionId,
              rank: i + 1,
            })),
          },
        },
        include: { choices: true },
      });

      return res.status(201).json(ballot);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Failed to submit ballot" });
    }
  }

  res.setHeader("Allow", "GET, POST");
  return res.status(405).json({ error: "Method not allowed" });
};
