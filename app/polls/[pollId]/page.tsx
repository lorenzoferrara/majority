import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "../../api/auth/[...nextauth]/route";
import { prisma } from "../../../lib/prisma";
import RankingBoard from "../../../components/RankingBoard";

export default async function VotingPage({
  params,
}: {
  params: { pollId: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/sign-in");

  const userId = session.user?.name!;

  const poll = await prisma.poll.findUnique({
    where: { id: params.pollId },
    include: {
      options: { orderBy: { order: "asc" } },
      ballots: {
        where: { userId },
        include: { choices: { orderBy: { rank: "asc" } } },
      },
    },
  });

  if (!poll) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream-100">
        <p className="font-display text-xl text-ink-500">Poll not found.</p>
      </div>
    );
  }

  if (poll.status === "DRAFT") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream-100">
        <p className="font-display text-xl text-ink-500">Poll not open yet.</p>
      </div>
    );
  }

  const existing = poll.ballots[0]?.choices.map((c) => c.optionId);

  return (
    <main className="min-h-screen bg-cream-100 px-6 py-16">
      <div className="max-w-2xl mx-auto">

        <header className="mb-10 text-center">
          <p className="text-xs tracking-[0.3em] uppercase text-gold-600 font-medium mb-3">Your Ballot</p>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-ink-900">{poll.title}</h1>
          <div className="mt-4 flex items-center justify-center gap-3">
            <div className="h-px w-10 bg-gold-400" />
            <span className="text-xs text-ink-200">Drag books to rank them · Submit when ready</span>
            <div className="h-px w-10 bg-gold-400" />
          </div>
        </header>

        {poll.status === "CLOSED" ? (
          <div className="text-center p-10 border border-cream-300 bg-cream-50">
            <p className="text-ink-700 mb-4 font-display text-lg">Voting is now closed.</p>
            <a
              href={`/results/${poll.id}`}
              className="text-gold-600 hover:text-gold-500 underline underline-offset-4 font-medium text-sm"
            >
              See results →
            </a>
          </div>
        ) : (
          <RankingBoard
            pollId={poll.id}
            options={poll.options}
            existingRanking={existing}
          />
        )}
      </div>
    </main>
  );
}
