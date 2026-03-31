const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// ── Instant-Runoff Voting (ported from lib/irv.ts) ───────────────────────────

function runIRV(ballots, options) {
  if (options.length === 0) return { winner: null, rounds: [], isTie: false };

  const active = new Set(options);
  const rounds = [];
  const liveBallots = ballots.map((b) =>
    b.preferences.filter((id) => options.includes(id))
  );

  let roundNumber = 0;

  while (active.size > 0) {
    roundNumber++;

    const counts = {};
    for (const id of active) counts[id] = 0;
    let totalActive = 0;

    for (const prefs of liveBallots) {
      const top = prefs.find((id) => active.has(id));
      if (top !== undefined) { counts[top]++; totalActive++; }
    }

    const majority = totalActive / 2;
    const winnerEntry = Object.entries(counts).find(([, v]) => v > majority);
    if (winnerEntry) {
      rounds.push({ round: roundNumber, counts, totalActive, eliminated: [], winner: winnerEntry[0] });
      return { winner: winnerEntry[0], rounds, isTie: false };
    }

    const minVotes = Math.min(...Object.values(counts));
    const toEliminate = Object.entries(counts).filter(([, v]) => v === minVotes).map(([id]) => id);

    if (toEliminate.length === active.size) {
      rounds.push({ round: roundNumber, counts, totalActive, eliminated: toEliminate });
      return { winner: null, rounds, isTie: true };
    }

    for (const id of toEliminate) active.delete(id);
    rounds.push({ round: roundNumber, counts, totalActive, eliminated: toEliminate });

    if (active.size === 1) {
      const lastStanding = [...active][0];
      rounds[rounds.length - 1].winner = lastStanding;
      return { winner: lastStanding, rounds, isTie: false };
    }
  }

  return { winner: null, rounds, isTie: false };
}

// ─────────────────────────────────────────────────────────────────────────────

module.exports = async (req, res) => {
  const { pollId } = req.query;

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const poll = await prisma.poll.findUnique({
    where: { id: pollId },
    include: {
      options: { orderBy: { order: "asc" } },
      ballots: { include: { choices: { orderBy: { rank: "asc" } } } },
    },
  });

  if (!poll) return res.status(404).json({ error: "Poll not found" });

  const optionIds = poll.options.map((o) => o.id);
  const optionMap = Object.fromEntries(poll.options.map((o) => [o.id, o]));

  const rawBallots = poll.ballots.map((b) => ({
    preferences: b.choices.map((r) => r.optionId),
  }));

  const { winner, rounds, isTie } = runIRV(rawBallots, optionIds);

  // Tally first-choice counts for display
  const firstChoiceCounts = {};
  for (const id of optionIds) firstChoiceCounts[id] = 0;
  for (const b of rawBallots) {
    if (b.preferences[0]) firstChoiceCounts[b.preferences[0]]++;
  }

  return res.status(200).json({
    poll: { id: poll.id, month: poll.month, status: poll.status },
    options: poll.options,
    totalBallots: poll.ballots.length,
    winner: winner ? optionMap[winner] : null,
    isTie,
    firstChoiceCounts,
    rounds: rounds.map((r) => ({
      round: r.round,
      counts: r.counts,
      totalActive: r.totalActive,
      eliminated: r.eliminated.map((id) => optionMap[id]),
      winner: r.winner ? optionMap[r.winner] : null,
    })),
  });
};
