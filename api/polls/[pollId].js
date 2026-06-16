const { PrismaClient } = require("@prisma/client");
const { requireAuth } = require("../../lib/auth");
const { fetchMonthOrdinalForPoll } = require("../../lib/pollMonthLabels");

const prisma = global.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") global.prisma = prisma;

function normalizeOptions(options) {
  const normalized = [];

  for (let i = 0; i < options.length; i++) {
    const option = options[i];

    if (!option || typeof option !== "object") {
      return { error: `Option ${i + 1} is invalid` };
    }

    const label = String(option.label ?? "").trim();
    if (!label) continue;

    const id = typeof option.id === "string" ? option.id : null;
    const authorRaw = option.author;
    const pageLengthRaw = option.pageLength;
    const goodreadsScoreRaw = option.goodreadsScore;

    const author = typeof authorRaw === "string" ? authorRaw.trim() : "";

    let pageLength = null;
    if (pageLengthRaw !== undefined && pageLengthRaw !== null && pageLengthRaw !== "") {
      const parsed = Number.parseInt(pageLengthRaw, 10);
      if (!Number.isInteger(parsed) || parsed <= 0) {
        return { error: `Option ${i + 1} has an invalid page length` };
      }
      pageLength = parsed;
    }

    let goodreadsScore = null;
    if (goodreadsScoreRaw !== undefined && goodreadsScoreRaw !== null && goodreadsScoreRaw !== "") {
      const parsed = Number.parseFloat(goodreadsScoreRaw);
      if (!Number.isFinite(parsed) || parsed < 0 || parsed > 5) {
        return { error: `Option ${i + 1} has an invalid Goodreads score` };
      }
      goodreadsScore = parsed;
    }

    normalized.push({
      id,
      label,
      author: author || null,
      pageLength,
      goodreadsScore,
      order: normalized.length,
    });
  }

  return { normalized };
}

module.exports = async function handler(req, res) {
  const pollId = req.query.pollId;
  const auth = requireAuth(req, res);
  if (!auth) return;

  // ── GET /api/polls/:pollId ──────────────────────────────────────────────
  if (req.method === "GET") {
    const userId = auth.name;

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
      const monthMeta = await fetchMonthOrdinalForPoll(prisma, poll);

      return res.status(200).json({ ...poll, ...monthMeta, existingRanking });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Failed to fetch poll" });
    }
  }

  // ── POST /api/polls/:pollId — submit ballot ─────────────────────────────
  if (req.method === "POST") {
    const { ranking } = req.body;
    const userId = auth.name;

    if (!Array.isArray(ranking) || ranking.length === 0) {
      return res.status(400).json({ error: "ranking array is required" });
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
    const { status, options } = req.body;

    if (Array.isArray(options)) {
      const { normalized, error } = normalizeOptions(options);
      if (error) {
        return res.status(400).json({ error });
      }
      if (!normalized || normalized.length === 0) {
        return res.status(400).json({ error: "At least one option with a book name is required" });
      }

      try {
        const existing = await prisma.option.findMany({
          where: { pollId },
          select: { id: true },
        });
        const existingIds = new Set(existing.map((o) => o.id));

        for (let i = 0; i < normalized.length; i++) {
          if (normalized[i].id && !existingIds.has(normalized[i].id)) {
            return res.status(400).json({ error: `Option ${i + 1} is not part of this poll` });
          }
        }

        const keepIds = normalized.filter((o) => o.id).map((o) => o.id);

        await prisma.$transaction(async (tx) => {
          await tx.option.deleteMany({
            where: {
              pollId,
              ...(keepIds.length > 0 ? { id: { notIn: keepIds } } : {}),
            },
          });

          for (const option of normalized) {
            if (option.id) {
              await tx.option.update({
                where: { id: option.id },
                data: {
                  label: option.label,
                  author: option.author,
                  pageLength: option.pageLength,
                  goodreadsScore: option.goodreadsScore,
                  order: option.order,
                },
              });
            } else {
              await tx.option.create({
                data: {
                  pollId,
                  label: option.label,
                  author: option.author,
                  pageLength: option.pageLength,
                  goodreadsScore: option.goodreadsScore,
                  order: option.order,
                },
              });
            }
          }
        });

        const updatedPoll = await prisma.poll.findUnique({
          where: { id: pollId },
          include: {
            options: { orderBy: { order: "asc" } },
            _count: { select: { ballots: true } },
          },
        });
        if (!updatedPoll) {
          return res.status(404).json({ error: "Poll not found" });
        }

        if (req.broadcast) req.broadcast("polls-changed", { action: "updated", pollId });
        return res.status(200).json(updatedPoll);
      } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Failed to update poll options" });
      }
    }

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
