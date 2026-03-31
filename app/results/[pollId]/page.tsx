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
    <main className="min-h-screen bg-cream-100 px-6 py-16">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <header className="mb-12 text-center">
          <p className="text-xs tracking-[0.3em] uppercase text-gold-600 font-medium mb-3">Final Results</p>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-ink-900">{poll.title}</h1>
          <div className="mt-4 flex items-center justify-center gap-3">
            <div className="h-px w-10 bg-gold-400" />
            <span className="text-xs text-ink-200">{poll._count.ballots} ballot{poll._count.ballots !== 1 ? "s" : ""} cast</span>
            <div className="h-px w-10 bg-gold-400" />
          </div>
        </header>

        {/* Winner */}
        {result.winner && (
          <div className="mb-12 border-2 border-gold-500 bg-cream-50 p-10 text-center">
            <div className="text-5xl mb-4">🏆</div>
            <p className="text-xs tracking-[0.3em] uppercase text-gold-600 font-medium mb-2">This Month We Read</p>
            <p className="font-display text-3xl font-bold text-ink-900">{optionLabel(result.winner)}</p>
          </div>
        )}

        {/* Tie */}
        {result.isTie && (
          <div className="mb-12 border border-cream-300 bg-cream-50 p-8 text-center">
            <p className="font-display text-xl text-ink-700">The election ended in a tie.</p>
          </div>
        )}

        {/* Round by round */}
        <section className="space-y-6">
          <h2 className="font-display text-xl font-semibold text-ink-900">Round by Round</h2>
          {result.rounds.map((round) => (
            <div key={round.round} className="border border-cream-300 bg-cream-50 p-5">
              <h3 className="text-xs font-medium tracking-widest uppercase text-ink-300 mb-4">
                Round {round.round}
              </h3>
              <ul className="space-y-3">
                {Object.entries(round.counts)
                  .sort(([, a], [, b]) => b - a)
                  .map(([id, count]) => {
                    const pct = round.totalActive
                      ? ((count / round.totalActive) * 100).toFixed(1)
                      : "0";
                    const isElim = round.eliminated.includes(id);
                    return (
                      <li key={id} className="flex items-center gap-3">
                        <span className={`w-40 truncate text-sm font-medium ${isElim ? "line-through text-ink-200" : "text-ink-800"}`}>
                          {optionLabel(id)}
                        </span>
                        <div className="flex-1 h-2 bg-cream-200 overflow-hidden">
                          <div
                            className={`h-2 transition-all duration-500 ${isElim ? "bg-ink-100" : "bg-gold-500"}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-xs text-ink-300 w-20 text-right tabular-nums">
                          {count} ({pct}%)
                        </span>
                      </li>
                    );
                  })}
              </ul>
            </div>
          ))}
        </section>

      </div>
    </main>
  );
}
