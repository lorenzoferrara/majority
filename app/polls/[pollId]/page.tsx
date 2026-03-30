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
      <div className="min-h-screen flex items-center justify-center bg-black text-orange-200">
        <p className="text-xl">Poll not found.</p>
      </div>
    );
  }

  if (poll.status === "DRAFT") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-orange-200">
        <p className="text-xl">Poll not open yet.</p>
      </div>
    );
  }

  const existing = poll.ballots[0]?.choices.map((c) => c.optionId);

  return (
    <main className="min-h-screen bg-black p-8">
      <h1 className="text-4xl font-bold text-orange-400 mb-8 text-center">
        🏆 {poll.title}
      </h1>

      {poll.status === "CLOSED" ? (
        <div className="flex justify-center">
          <div className="bg-gradient-to-br from-orange-500/20 to-orange-300/10 border border-orange-400 rounded-xl p-6 text-center">
            <p className="text-orange-200 mb-3">Voting is closed.</p>
            <a
              href={`/results/${poll.id}`}
              className="text-orange-400 underline font-medium"
            >
              See results →
            </a>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          <RankingBoard
            pollId={poll.id}
            options={poll.options}
            existingRanking={existing}
          />
        </div>
      )}
    </main>
  );
}