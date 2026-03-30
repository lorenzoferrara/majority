import { prisma } from "@/lib/prisma";
import { calculateResults } from "@/actions/votes";

export default async function ResultsPage({
  params,
}: {
  params: { pollId: string };
}) {
  const poll = await prisma.poll.findUnique({
    where: { id: params.pollId },
    include: {
      options: true,
      _count: { select: { ballots: true } },
    },
  });

  if (!poll) return <div>Poll not found.</div>;

  const result = await calculateResults(params.pollId);
  const optionLabel = (id: string) =>
    poll.options.find((o) => o.id === id)?.label ?? id;

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold">{poll.title} — Results</h1>
      <p className="mt-1 text-gray-500">{poll._count.ballots} ballots cast</p>

      {result.winner && (
        <div className="mt-8 rounded-2xl border-2 border-yellow-400 bg-yellow-50 p-8 text-center">
          <div className="text-5xl">🏆</div>
          <p className="mt-3 text-2xl font-bold">{optionLabel(result.winner)}</p>
        </div>
      )}

      {result.isTie && (
        <div className="mt-8 rounded-xl bg-gray-100 p-6 text-center">
          <p className="text-lg font-semibold">The election ended in a tie.</p>
        </div>
      )}

      <section className="mt-12 space-y-6">
        <h2 className="text-xl font-semibold">Round by round</h2>
        {result.rounds.map((round) => (
          <div key={round.round} className="rounded-xl border p-5">
            <h3 className="font-semibold">Round {round.round}</h3>
            <ul className="mt-3 space-y-2">
              {Object.entries(round.counts)
                .sort(([, a], [, b]) => b - a)
                .map(([id, count]) => {
                  const pct = round.totalActive
                    ? ((count / round.totalActive) * 100).toFixed(1)
                    : "0";
                  const isElim = round.eliminated.includes(id);
                  return (
                    <li key={id} className="flex items-center gap-3">
                      <span className={`w-40 truncate text-sm ${isElim ? "line-through text-gray-400" : ""}`}>
                        {optionLabel(id)}
                      </span>
                      <div className="flex-1 h-4 rounded-full bg-gray-100 overflow-hidden">
                        <div
                          className="h-4 rounded-full bg-indigo-400"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-500 w-20 text-right">
                        {count} ({pct}%)
                      </span>
                    </li>
                  );
                })}
            </ul>
          </div>
        ))}
      </section>
    </main>
  );
}