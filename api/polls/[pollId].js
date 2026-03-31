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
      // Reject if ballot already exists
      const existing = await prisma.ballot.findFirst({ where: { pollId, userId } });
      if (existing) {
        return res.status(409).json({ error: "You have already voted in this poll." });
      }

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

      if (req.broadcast) req.broadcast("ballot-submitted", { pollId });
      return res.status(201).json(ballot);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Failed to submit ballot" });
    }
  }

  // ── PATCH /api/polls/:pollId — update status ───────────────────────────
  if (req.method === "PATCH") {
    const { status } = req.body;
    const valid = ["OPEN", "CLOSED"];
    if (!status || !valid.includes(status)) {
      return res.status(400).json({ error: "status must be OPEN or CLOSED" });
    }
    try {
      const poll = await prisma.poll.update({
        where: { id: pollId },
        data: { status },
      });
      if (req.broadcast) req.broadcast("polls-changed", { action: "updated", pollId });
      return res.status(200).json(poll);
    } catch (err) {
      if (err.code === "P2025") return res.status(404).json({ error: "Poll not found" });
      console.error(err);
      return res.status(500).json({ error: "Failed to update poll" });
    }
  }

  // ── DELETE /api/polls/:pollId ───────────────────────────────────────────
  if (req.method === "DELETE") {
    try {
      await prisma.poll.delete({ where: { id: pollId } });
      if (req.broadcast) req.broadcast("polls-changed", { action: "deleted", pollId });
      return res.status(204).end();
    } catch (err) {
      if (err.code === "P2025") return res.status(404).json({ error: "Poll not found" });
      console.error(err);
      return res.status(500).json({ error: "Failed to delete poll" });
    }
  }

  res.setHeader("Allow", "GET, POST, PATCH, DELETE");
  return res.status(405).json({ error: "Method not allowed" });
};
