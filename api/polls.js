const { PrismaClient } = require("@prisma/client");
const { requireAuth } = require("../lib/auth");
const { attachMonthOrdinals } = require("../lib/pollMonthLabels");

const prisma = global.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") global.prisma = prisma;

function normalizeOptions(options) {
  const normalized = [];

  for (let i = 0; i < options.length; i++) {
    const option = options[i];

    if (typeof option === "string") {
      const label = option.trim();
      if (!label) continue;
      normalized.push({ label, order: normalized.length });
      continue;
    }

    if (!option || typeof option !== "object") {
      return { error: `Option ${i + 1} is invalid` };
    }

    const label = String(option.label ?? "").trim();
    if (!label) continue;

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
  const auth = requireAuth(req, res);
  if (!auth) return;

  if (req.method === "GET") {
    try {
      const polls = await prisma.poll.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          options: { orderBy: { order: "asc" } },
          _count: { select: { ballots: true } },
        },
      });
      return res.status(200).json(attachMonthOrdinals(polls));
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Failed to fetch polls" });
    }
  }

  if (req.method === "POST") {
    const { month, status, options } = req.body;

    if (!month || !Array.isArray(options) || options.length === 0) {
      return res.status(400).json({ error: "month and at least one option are required" });
    }

    const { normalized, error } = normalizeOptions(options);
    if (error) {
      return res.status(400).json({ error });
    }
    if (!normalized || normalized.length === 0) {
      return res.status(400).json({ error: "At least one option with a book name is required" });
    }

    try {
      const poll = await prisma.poll.create({
        data: {
          month,
          status: status ?? "OPEN",
          options: {
            create: normalized,
          },
        },
        include: { options: true },
      });
      if (req.broadcast) req.broadcast("polls-changed", { action: "created", pollId: poll.id });
      return res.status(201).json(poll);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Failed to create poll" });
    }
  }

  res.setHeader("Allow", "GET, POST");
  return res.status(405).json({ error: "Method not allowed" });
};
