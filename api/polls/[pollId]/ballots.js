const { PrismaClient } = require("@prisma/client");
const { requireAuth } = require("../../../lib/auth");

const prisma = global.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") global.prisma = prisma;

module.exports = async function handler(req, res) {
  const pollId = req.query.pollId;
  const auth = requireAuth(req, res);
  if (!auth) return;

  if (req.method === "GET") {
    try {
      const poll = await prisma.poll.findUnique({
        where: { id: pollId },
        select: { id: true, month: true },
      });

      if (!poll) {
        return res.status(404).json({ error: "Poll not found" });
      }

      const ballots = await prisma.ballot.findMany({
        where: { pollId },
        orderBy: { submittedAt: "desc" },
        include: {
          choices: {
            orderBy: { rank: "asc" },
            include: {
              option: {
                select: { id: true, label: true },
              },
            },
          },
        },
      });

      return res.status(200).json({
        poll,
        ballots: ballots.map((ballot) => ({
          id: ballot.id,
          pollId: ballot.pollId,
          userId: ballot.userId,
          submittedAt: ballot.submittedAt,
          ranking: ballot.choices.map((choice) => ({
            rank: choice.rank,
            optionId: choice.option.id,
            label: choice.option.label,
          })),
        })),
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Failed to fetch ballots" });
    }
  }

  res.setHeader("Allow", "GET");
  return res.status(405).json({ error: "Method not allowed" });
};
