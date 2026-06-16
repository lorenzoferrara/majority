function sortByCreatedAtThenId(a, b) {
  const aTime = new Date(a.createdAt).getTime();
  const bTime = new Date(b.createdAt).getTime();

  if (aTime !== bTime) return aTime - bTime;
  return String(a.id).localeCompare(String(b.id));
}

function buildMonthOrdinalMap(polls) {
  const grouped = new Map();

  for (const poll of polls) {
    const key = String(poll.month);
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(poll);
  }

  const byId = new Map();
  for (const entries of grouped.values()) {
    entries.sort(sortByCreatedAtThenId);
    const count = entries.length;
    entries.forEach((poll, index) => {
      byId.set(String(poll.id), { monthOrdinal: index + 1, monthCount: count });
    });
  }

  return byId;
}

function attachMonthOrdinals(polls) {
  const ordinalMap = buildMonthOrdinalMap(polls);
  return polls.map((poll) => {
    const monthMeta = ordinalMap.get(String(poll.id)) || { monthOrdinal: 1, monthCount: 1 };
    return { ...poll, ...monthMeta };
  });
}

async function fetchMonthOrdinalForPoll(prisma, poll) {
  const siblings = await prisma.poll.findMany({
    where: { month: poll.month },
    select: { id: true, month: true, createdAt: true },
  });

  const map = buildMonthOrdinalMap(siblings);
  return map.get(String(poll.id)) || { monthOrdinal: 1, monthCount: 1 };
}

module.exports = {
  attachMonthOrdinals,
  fetchMonthOrdinalForPoll,
};
