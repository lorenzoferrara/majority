const { PrismaClient } = require("@prisma/client");
const { requireAuth } = require("../../../../lib/auth");

const prisma = global.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") global.prisma = prisma;

module.exports = async function handler(req, res) {
  const pollId = req.query.pollId;
  const ballotId = req.query.ballotId;
  const auth = requireAuth(req, res);
  if (!auth) return;

  if (req.method === "DELETE") {
    try {
      const result = await prisma.ballot.deleteMany({
        where: {
          id: ballotId,
          pollId,
        },
      });

      if (result.count === 0) {
        return res.status(404).json({ error: "Ballot not found" });
      }

      if (req.broadcast) {
        req.broadcast("polls-changed", { action: "ballot-reset", pollId, ballotId });
      }

      return res.status(204).end();
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Failed to delete ballot" });
    }
  }

  res.setHeader("Allow", "DELETE");
  return res.status(405).json({ error: "Method not allowed" });
};
