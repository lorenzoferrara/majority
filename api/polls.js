const { PrismaClient } = require("@prisma/client");

const prisma = global.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") global.prisma = prisma;

module.exports = async function handler(req, res) {
  if (req.method === "GET") {
    try {
      const polls = await prisma.poll.findMany({
        orderBy: { createdAt: "desc" },
        include: { options: { orderBy: { order: "asc" } } },
      });
      return res.status(200).json(polls);
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

    try {
      const poll = await prisma.poll.create({
        data: {
          month,
          status: status ?? "DRAFT",
          options: {
            create: options.map((label, i) => ({ label, order: i })),
          },
        },
        include: { options: true },
      });
      return res.status(201).json(poll);
    } catch (err) {
      if (err.code === "P2002") {
        return res.status(409).json({ error: `A poll for ${month} already exists` });
      }
      console.error(err);
      return res.status(500).json({ error: "Failed to create poll" });
    }
  }

  res.setHeader("Allow", "GET, POST");
  return res.status(405).json({ error: "Method not allowed" });
};
